"""
Reddit API Client for Content Crawling

Handles Reddit API calls for content crawling, data parsing, and error handling.
"""

import asyncio
import httpx
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Tuple
from urllib.parse import urlencode
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from fastapi import HTTPException, status

from app.core.config import settings


logger = logging.getLogger(__name__)


class RedditAPIError(Exception):
    """Custom exception for Reddit API errors."""
    pass


class RedditRateLimitError(RedditAPIError):
    """Exception for Reddit API rate limit errors."""
    pass


class RedditClient:
    """
    Reddit API client for content crawling.
    
    Handles authentication, API calls, rate limiting, and data parsing.
    """
    
    def __init__(self):
        self.client_id = settings.REDDIT_CLIENT_ID
        self.client_secret = settings.REDDIT_CLIENT_SECRET
        self.user_agent = settings.REDDIT_USER_AGENT
        
        # Reddit API endpoints
        self.base_url = "https://oauth.reddit.com"
        self.token_url = "https://www.reddit.com/api/v1/access_token"
        
        # Rate limiting (Reddit allows 60 requests per minute)
        self.rate_limit_requests = 60
        self.rate_limit_window = 60  # seconds
        self.request_timestamps = []
        
        # Access token management
        self._access_token = None
        self._token_expires_at = None
    
    async def _get_app_only_token(self) -> str:
        """
        Get application-only access token for Reddit API.
        
        Returns:
            Access token string
            
        Raises:
            RedditAPIError: If token request fails
        """
        if self._access_token and self._token_expires_at:
            # Check if token is still valid (with 5 minute buffer)
            if datetime.now(timezone.utc).timestamp() < (self._token_expires_at - 300):
                return self._access_token
        
        # Request new token
        data = {
            "grant_type": "client_credentials"
        }
        
        headers = {
            "User-Agent": self.user_agent,
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        auth = (self.client_id, self.client_secret)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.token_url,
                    data=data,
                    headers=headers,
                    auth=auth,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    raise RedditAPIError(f"Failed to get access token: {response.text}")
                
                token_data = response.json()
                self._access_token = token_data.get("access_token")
                expires_in = token_data.get("expires_in", 3600)
                self._token_expires_at = datetime.now(timezone.utc).timestamp() + expires_in
                
                logger.info("Successfully obtained Reddit API access token")
                return self._access_token
                
        except httpx.RequestError as e:
            raise RedditAPIError(f"Failed to connect to Reddit API: {str(e)}")
    
    async def _check_rate_limit(self):
        """
        Check and enforce rate limiting.
        
        Raises:
            RedditRateLimitError: If rate limit would be exceeded
        """
        now = datetime.now(timezone.utc).timestamp()
        
        # Remove timestamps older than the rate limit window
        self.request_timestamps = [
            ts for ts in self.request_timestamps 
            if now - ts < self.rate_limit_window
        ]
        
        # Check if we're at the rate limit
        if len(self.request_timestamps) >= self.rate_limit_requests:
            oldest_request = min(self.request_timestamps)
            wait_time = self.rate_limit_window - (now - oldest_request)
            
            if wait_time > 0:
                logger.warning(f"Rate limit reached, waiting {wait_time:.2f} seconds")
                await asyncio.sleep(wait_time)
        
        # Record this request
        self.request_timestamps.append(now)
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((httpx.RequestError, RedditAPIError))
    )
    async def _make_request(self, endpoint: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Make authenticated request to Reddit API with retry logic.
        
        Args:
            endpoint: API endpoint (without base URL)
            params: Query parameters
            
        Returns:
            JSON response data
            
        Raises:
            RedditAPIError: If request fails after retries
            RedditRateLimitError: If rate limited
        """
        await self._check_rate_limit()
        
        access_token = await self._get_app_only_token()
        
        headers = {
            "User-Agent": self.user_agent,
            "Authorization": f"Bearer {access_token}"
        }
        
        url = f"{self.base_url}{endpoint}"
        if params:
            url += f"?{urlencode(params)}"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, timeout=30.0)
                
                # Handle rate limiting
                if response.status_code == 429:
                    retry_after = int(response.headers.get("retry-after", 60))
                    logger.warning(f"Rate limited by Reddit API, waiting {retry_after} seconds")
                    await asyncio.sleep(retry_after)
                    raise RedditRateLimitError("Rate limited by Reddit API")
                
                # Handle other errors
                if response.status_code != 200:
                    error_msg = f"Reddit API error {response.status_code}: {response.text}"
                    logger.error(error_msg)
                    raise RedditAPIError(error_msg)
                
                return response.json()
                
        except httpx.RequestError as e:
            error_msg = f"Failed to connect to Reddit API: {str(e)}"
            logger.error(error_msg)
            raise RedditAPIError(error_msg)
    
    def _parse_post_data(self, post_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse Reddit post data into standardized format.
        
        Args:
            post_data: Raw post data from Reddit API
            
        Returns:
            Parsed post data
        """
        data = post_data.get("data", {})
        
        # Convert UTC timestamp to datetime
        created_utc = None
        if data.get("created_utc"):
            created_utc = datetime.fromtimestamp(data["created_utc"], tz=timezone.utc)
        
        return {
            "reddit_id": data.get("id"),
            "title": data.get("title", ""),
            "content": data.get("selftext", ""),
            "author": data.get("author"),
            "subreddit": data.get("subreddit"),
            "url": data.get("url"),
            "score": data.get("score", 0),
            "num_comments": data.get("num_comments", 0),
            "created_utc": created_utc,
            "permalink": data.get("permalink"),
            "is_self": data.get("is_self", False),
            "over_18": data.get("over_18", False),
            "stickied": data.get("stickied", False),
            "locked": data.get("locked", False)
        }
    
    def _parse_comment_data(self, comment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse Reddit comment data into standardized format.
        
        Args:
            comment_data: Raw comment data from Reddit API
            
        Returns:
            Parsed comment data
        """
        data = comment_data.get("data", {})
        
        # Skip deleted/removed comments
        if data.get("author") in ["[deleted]", "[removed]", None]:
            return None
        
        # Convert UTC timestamp to datetime
        created_utc = None
        if data.get("created_utc"):
            created_utc = datetime.fromtimestamp(data["created_utc"], tz=timezone.utc)
        
        return {
            "reddit_id": data.get("id"),
            "body": data.get("body", ""),
            "author": data.get("author"),
            "score": data.get("score", 0),
            "created_utc": created_utc,
            "parent_id": data.get("parent_id"),
            "is_submitter": data.get("is_submitter", False)
        }
    
    async def search_posts(
        self, 
        query: str, 
        subreddit: Optional[str] = None,
        sort: str = "relevance",
        time_filter: str = "all",
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Search for posts on Reddit.
        
        Args:
            query: Search query
            subreddit: Specific subreddit to search (optional)
            sort: Sort method (relevance, hot, top, new, comments)
            time_filter: Time filter (all, year, month, week, day, hour)
            limit: Maximum number of posts to return (max 100)
            
        Returns:
            List of parsed post data
            
        Raises:
            RedditAPIError: If search fails
        """
        # Build endpoint
        if subreddit:
            endpoint = f"/r/{subreddit}/search"
        else:
            endpoint = "/search"
        
        # Build parameters
        params = {
            "q": query,
            "sort": sort,
            "t": time_filter,
            "limit": min(limit, 100),
            "type": "link",
            "restrict_sr": "true" if subreddit else "false"
        }
        
        try:
            logger.info(f"Searching Reddit posts: query='{query}', subreddit={subreddit}")
            response = await self._make_request(endpoint, params)
            
            posts = []
            for child in response.get("data", {}).get("children", []):
                if child.get("kind") == "t3":  # t3 = post
                    parsed_post = self._parse_post_data(child)
                    if parsed_post.get("reddit_id"):
                        posts.append(parsed_post)
            
            logger.info(f"Found {len(posts)} posts for query '{query}'")
            return posts
            
        except Exception as e:
            logger.error(f"Failed to search posts: {str(e)}")
            raise RedditAPIError(f"Failed to search posts: {str(e)}")
    
    async def get_subreddit_posts(
        self,
        subreddit: str,
        sort: str = "hot",
        time_filter: str = "day",
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get posts from a specific subreddit.
        
        Args:
            subreddit: Subreddit name
            sort: Sort method (hot, new, top, rising)
            time_filter: Time filter for 'top' sort (all, year, month, week, day, hour)
            limit: Maximum number of posts to return (max 100)
            
        Returns:
            List of parsed post data
            
        Raises:
            RedditAPIError: If request fails
        """
        endpoint = f"/r/{subreddit}/{sort}"
        
        params = {
            "limit": min(limit, 100)
        }
        
        if sort == "top":
            params["t"] = time_filter
        
        try:
            logger.info(f"Getting posts from r/{subreddit} (sort={sort})")
            response = await self._make_request(endpoint, params)
            
            posts = []
            for child in response.get("data", {}).get("children", []):
                if child.get("kind") == "t3":  # t3 = post
                    parsed_post = self._parse_post_data(child)
                    if parsed_post.get("reddit_id"):
                        posts.append(parsed_post)
            
            logger.info(f"Retrieved {len(posts)} posts from r/{subreddit}")
            return posts
            
        except Exception as e:
            logger.error(f"Failed to get subreddit posts: {str(e)}")
            raise RedditAPIError(f"Failed to get subreddit posts: {str(e)}")
    
    async def get_post_comments(
        self,
        subreddit: str,
        post_id: str,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get comments for a specific post.
        
        Args:
            subreddit: Subreddit name
            post_id: Reddit post ID
            limit: Maximum number of comments to return
            
        Returns:
            List of parsed comment data
            
        Raises:
            RedditAPIError: If request fails
        """
        endpoint = f"/r/{subreddit}/comments/{post_id}"
        
        params = {
            "limit": limit,
            "depth": 3,  # Limit comment depth
            "sort": "top"
        }
        
        try:
            logger.info(f"Getting comments for post {post_id} in r/{subreddit}")
            response = await self._make_request(endpoint, params)
            
            # Reddit returns an array with post data and comments
            if not isinstance(response, list) or len(response) < 2:
                return []
            
            comments_data = response[1].get("data", {}).get("children", [])
            comments = []
            
            def extract_comments(comment_list):
                """Recursively extract comments from nested structure."""
                for comment in comment_list:
                    if comment.get("kind") == "t1":  # t1 = comment
                        parsed_comment = self._parse_comment_data(comment)
                        if parsed_comment:
                            comments.append(parsed_comment)
                        
                        # Process replies
                        replies = comment.get("data", {}).get("replies")
                        if isinstance(replies, dict):
                            reply_children = replies.get("data", {}).get("children", [])
                            extract_comments(reply_children)
            
            extract_comments(comments_data)
            
            logger.info(f"Retrieved {len(comments)} comments for post {post_id}")
            return comments
            
        except Exception as e:
            logger.error(f"Failed to get post comments: {str(e)}")
            raise RedditAPIError(f"Failed to get post comments: {str(e)}")
    
    async def get_trending_subreddits(self, limit: int = 50) -> List[str]:
        """
        Get list of trending subreddits.
        
        Args:
            limit: Maximum number of subreddits to return
            
        Returns:
            List of subreddit names
            
        Raises:
            RedditAPIError: If request fails
        """
        endpoint = "/subreddits/popular"
        
        params = {
            "limit": min(limit, 100)
        }
        
        try:
            logger.info("Getting trending subreddits")
            response = await self._make_request(endpoint, params)
            
            subreddits = []
            for child in response.get("data", {}).get("children", []):
                if child.get("kind") == "t5":  # t5 = subreddit
                    subreddit_name = child.get("data", {}).get("display_name")
                    if subreddit_name:
                        subreddits.append(subreddit_name)
            
            logger.info(f"Retrieved {len(subreddits)} trending subreddits")
            return subreddits
            
        except Exception as e:
            logger.error(f"Failed to get trending subreddits: {str(e)}")
            raise RedditAPIError(f"Failed to get trending subreddits: {str(e)}")
    
    async def validate_subreddit(self, subreddit: str) -> bool:
        """
        Validate if a subreddit exists and is accessible.
        
        Args:
            subreddit: Subreddit name to validate
            
        Returns:
            True if subreddit is valid and accessible, False otherwise
        """
        endpoint = f"/r/{subreddit}/about"
        
        try:
            response = await self._make_request(endpoint)
            return response.get("kind") == "t5"  # t5 = subreddit
            
        except RedditAPIError:
            return False


# Global client instance
reddit_client = RedditClient()


def get_reddit_client() -> RedditClient:
    """Get Reddit API client instance."""
    return reddit_client