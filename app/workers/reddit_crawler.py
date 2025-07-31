"""
Reddit Crawler Celery Workers

Background tasks for crawling Reddit content based on user keywords.
"""

import logging
import time
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from celery import current_task
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.celery_app import celery_app
from app.core.database import get_db
from app.core.metrics import (
    record_crawling_job_start, 
    record_crawling_job_complete, 
    record_error
)
from app.services.notification_service import notification_service
from app.services.reddit_client import get_reddit_client, RedditAPIError
from app.models.keyword import Keyword
from app.models.post import Post
from app.models.comment import Comment
from app.models.process_log import ProcessLog


logger = logging.getLogger(__name__)


def get_db_session() -> Session:
    """Get database session for worker tasks."""
    db = next(get_db())
    try:
        return db
    finally:
        pass  # Don't close here, will be closed by caller


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def crawl_keyword_posts(self, keyword_id: int, limit: int = 100) -> Dict[str, Any]:
    """
    Crawl Reddit posts for a specific keyword.
    
    Args:
        keyword_id: ID of the keyword to crawl
        limit: Maximum number of posts to crawl
        
    Returns:
        Dictionary with crawling results
    """
    db = get_db_session()
    reddit_client = get_reddit_client()
    start_time = time.time()
    
    # Record job start
    record_crawling_job_start("keyword_crawl")
    
    try:
        # Update task status
        current_task.update_state(
            state='PROGRESS',
            meta={'status': 'Starting crawl', 'progress': 0}
        )
        
        # Get keyword from database
        keyword = db.query(Keyword).filter(Keyword.id == keyword_id).first()
        if not keyword:
            raise ValueError(f"Keyword with ID {keyword_id} not found")
        
        if not keyword.is_active:
            logger.info(f"Keyword '{keyword.keyword}' is inactive, skipping crawl")
            return {
                'status': 'skipped',
                'keyword_id': keyword_id,
                'keyword': keyword.keyword,
                'reason': 'Keyword is inactive'
            }
        
        # Create process log
        process_log = ProcessLog(
            user_id=keyword.user_id,
            process_type='keyword_crawl',
            status='running',
            details={
                'keyword_id': keyword_id,
                'keyword': keyword.keyword,
                'limit': limit
            }
        )
        db.add(process_log)
        db.commit()
        
        logger.info(f"Starting crawl for keyword: '{keyword.keyword}' (ID: {keyword_id})")
        
        # Update progress
        current_task.update_state(
            state='PROGRESS',
            meta={'status': f'Crawling posts for keyword: {keyword.keyword}', 'progress': 10}
        )
        
        # Search for posts using the keyword
        import asyncio
        posts_data = asyncio.run(reddit_client.search_posts(
            query=keyword.keyword,
            sort="new",
            time_filter="week",
            limit=limit
        ))
        
        # Update progress
        current_task.update_state(
            state='PROGRESS',
            meta={'status': f'Processing {len(posts_data)} posts', 'progress': 50}
        )
        
        # Save posts to database
        saved_posts = 0
        duplicate_posts = 0
        failed_posts = 0
        
        for i, post_data in enumerate(posts_data):
            try:
                # Check if post already exists
                existing_post = db.query(Post).filter(
                    Post.reddit_id == post_data['reddit_id']
                ).first()
                
                if existing_post:
                    duplicate_posts += 1
                    continue
                
                # Create new post
                post = Post(
                    keyword_id=keyword_id,
                    reddit_id=post_data['reddit_id'],
                    title=post_data['title'],
                    content=post_data['content'],
                    author=post_data['author'],
                    subreddit=post_data['subreddit'],
                    url=post_data['url'],
                    score=post_data['score'],
                    num_comments=post_data['num_comments'],
                    created_utc=post_data['created_utc']
                )
                
                db.add(post)
                db.commit()
                saved_posts += 1
                
                # Update progress
                progress = 50 + (i + 1) / len(posts_data) * 40
                current_task.update_state(
                    state='PROGRESS',
                    meta={
                        'status': f'Saved {saved_posts} posts',
                        'progress': int(progress)
                    }
                )
                
            except IntegrityError:
                db.rollback()
                duplicate_posts += 1
            except Exception as e:
                db.rollback()
                failed_posts += 1
                logger.error(f"Failed to save post {post_data.get('reddit_id')}: {str(e)}")
        
        # Update process log
        process_log.status = 'completed'
        process_log.completed_at = datetime.now(timezone.utc)
        process_log.details.update({
            'posts_found': len(posts_data),
            'posts_saved': saved_posts,
            'posts_duplicate': duplicate_posts,
            'posts_failed': failed_posts
        })
        db.commit()
        
        # Record successful completion
        duration = time.time() - start_time
        record_crawling_job_complete(
            job_type="keyword_crawl",
            duration=duration,
            status="completed",
            posts_count=saved_posts,
            keyword=keyword.keyword,
            subreddit="multiple"
        )
        
        result = {
            'status': 'completed',
            'keyword_id': keyword_id,
            'keyword': keyword.keyword,
            'posts_found': len(posts_data),
            'posts_saved': saved_posts,
            'posts_duplicate': duplicate_posts,
            'posts_failed': failed_posts,
            'process_log_id': process_log.id
        }
        
        logger.info(f"Completed crawl for keyword '{keyword.keyword}': {result}")
        return result
        
    except RedditAPIError as e:
        # Record error metrics
        record_error("RedditAPIError", "crawler")
        duration = time.time() - start_time
        record_crawling_job_complete(
            job_type="keyword_crawl",
            duration=duration,
            status="failed"
        )
        
        # Update process log with error
        if 'process_log' in locals():
            process_log.status = 'failed'
            process_log.completed_at = datetime.now(timezone.utc)
            process_log.error_message = str(e)
            db.commit()
        
        logger.error(f"Reddit API error while crawling keyword {keyword_id}: {str(e)}")
        
        # Retry on API errors
        try:
            self.retry(countdown=60 * (self.request.retries + 1))
        except self.MaxRetriesExceededError:
            # Send notification for max retries exceeded
            if 'keyword' in locals():
                import asyncio
                asyncio.create_task(notification_service.alert_crawling_failure(
                    keyword_id=keyword_id,
                    keyword=keyword.keyword,
                    error=f"Max retries exceeded: {str(e)}"
                ))
            return {
                'status': 'failed',
                'keyword_id': keyword_id,
                'error': f"Max retries exceeded: {str(e)}"
            }
    
    except Exception as e:
        # Record error metrics
        record_error("UnexpectedError", "crawler")
        duration = time.time() - start_time
        record_crawling_job_complete(
            job_type="keyword_crawl",
            duration=duration,
            status="failed"
        )
        
        # Update process log with error
        if 'process_log' in locals():
            process_log.status = 'failed'
            process_log.completed_at = datetime.now(timezone.utc)
            process_log.error_message = str(e)
            db.commit()
        
        logger.error(f"Unexpected error while crawling keyword {keyword_id}: {str(e)}")
        return {
            'status': 'failed',
            'keyword_id': keyword_id,
            'error': str(e)
        }
    
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def crawl_post_comments(self, post_id: int, limit: int = 50) -> Dict[str, Any]:
    """
    Crawl comments for a specific post.
    
    Args:
        post_id: ID of the post to crawl comments for
        limit: Maximum number of comments to crawl
        
    Returns:
        Dictionary with crawling results
    """
    db = get_db_session()
    reddit_client = get_reddit_client()
    
    try:
        # Get post from database
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise ValueError(f"Post with ID {post_id} not found")
        
        logger.info(f"Starting comment crawl for post: {post.reddit_id}")
        
        # Update task status
        current_task.update_state(
            state='PROGRESS',
            meta={'status': f'Crawling comments for post: {post.title[:50]}...', 'progress': 10}
        )
        
        # Get comments from Reddit
        import asyncio
        comments_data = asyncio.run(reddit_client.get_post_comments(
            subreddit=post.subreddit,
            post_id=post.reddit_id,
            limit=limit
        ))
        
        # Update progress
        current_task.update_state(
            state='PROGRESS',
            meta={'status': f'Processing {len(comments_data)} comments', 'progress': 50}
        )
        
        # Save comments to database
        saved_comments = 0
        duplicate_comments = 0
        failed_comments = 0
        
        for i, comment_data in enumerate(comments_data):
            try:
                # Check if comment already exists
                existing_comment = db.query(Comment).filter(
                    Comment.reddit_id == comment_data['reddit_id']
                ).first()
                
                if existing_comment:
                    duplicate_comments += 1
                    continue
                
                # Create new comment
                comment = Comment(
                    post_id=post_id,
                    reddit_id=comment_data['reddit_id'],
                    body=comment_data['body'],
                    author=comment_data['author'],
                    score=comment_data['score'],
                    created_utc=comment_data['created_utc']
                )
                
                db.add(comment)
                db.commit()
                saved_comments += 1
                
                # Update progress
                progress = 50 + (i + 1) / len(comments_data) * 40
                current_task.update_state(
                    state='PROGRESS',
                    meta={
                        'status': f'Saved {saved_comments} comments',
                        'progress': int(progress)
                    }
                )
                
            except IntegrityError:
                db.rollback()
                duplicate_comments += 1
            except Exception as e:
                db.rollback()
                failed_comments += 1
                logger.error(f"Failed to save comment {comment_data.get('reddit_id')}: {str(e)}")
        
        result = {
            'status': 'completed',
            'post_id': post_id,
            'post_reddit_id': post.reddit_id,
            'comments_found': len(comments_data),
            'comments_saved': saved_comments,
            'comments_duplicate': duplicate_comments,
            'comments_failed': failed_comments
        }
        
        logger.info(f"Completed comment crawl for post {post.reddit_id}: {result}")
        return result
        
    except RedditAPIError as e:
        logger.error(f"Reddit API error while crawling comments for post {post_id}: {str(e)}")
        
        # Retry on API errors
        try:
            self.retry(countdown=60 * (self.request.retries + 1))
        except self.MaxRetriesExceededError:
            return {
                'status': 'failed',
                'post_id': post_id,
                'error': f"Max retries exceeded: {str(e)}"
            }
    
    except Exception as e:
        logger.error(f"Unexpected error while crawling comments for post {post_id}: {str(e)}")
        return {
            'status': 'failed',
            'post_id': post_id,
            'error': str(e)
        }
    
    finally:
        db.close()


@celery_app.task(bind=True)
def crawl_trending_posts(self, limit: int = 100) -> Dict[str, Any]:
    """
    Crawl trending posts from popular subreddits.
    
    Args:
        limit: Maximum number of posts to crawl per subreddit
        
    Returns:
        Dictionary with crawling results
    """
    db = get_db_session()
    reddit_client = get_reddit_client()
    
    try:
        logger.info("Starting trending posts crawl")
        
        # Update task status
        current_task.update_state(
            state='PROGRESS',
            meta={'status': 'Getting trending subreddits', 'progress': 5}
        )
        
        # Get trending subreddits
        import asyncio
        trending_subreddits = asyncio.run(reddit_client.get_trending_subreddits(limit=20))
        
        # Update progress
        current_task.update_state(
            state='PROGRESS',
            meta={'status': f'Found {len(trending_subreddits)} trending subreddits', 'progress': 10}
        )
        
        total_posts_found = 0
        total_posts_saved = 0
        subreddits_processed = 0
        
        # Process each trending subreddit
        for i, subreddit in enumerate(trending_subreddits):
            try:
                # Update progress
                progress = 10 + (i / len(trending_subreddits)) * 80
                current_task.update_state(
                    state='PROGRESS',
                    meta={
                        'status': f'Processing r/{subreddit}',
                        'progress': int(progress)
                    }
                )
                
                # Get hot posts from subreddit
                posts_data = asyncio.run(reddit_client.get_subreddit_posts(
                    subreddit=subreddit,
                    sort="hot",
                    limit=min(limit, 25)  # Limit per subreddit to avoid overwhelming
                ))
                
                total_posts_found += len(posts_data)
                
                # Save posts (only if they match existing keywords)
                for post_data in posts_data:
                    # Find matching keywords
                    matching_keywords = db.query(Keyword).filter(
                        Keyword.is_active == True,
                        Keyword.keyword.ilike(f"%{post_data['title']}%")
                    ).all()
                    
                    for keyword in matching_keywords:
                        try:
                            # Check if post already exists for this keyword
                            existing_post = db.query(Post).filter(
                                Post.reddit_id == post_data['reddit_id'],
                                Post.keyword_id == keyword.id
                            ).first()
                            
                            if not existing_post:
                                # Create new post
                                post = Post(
                                    keyword_id=keyword.id,
                                    reddit_id=post_data['reddit_id'],
                                    title=post_data['title'],
                                    content=post_data['content'],
                                    author=post_data['author'],
                                    subreddit=post_data['subreddit'],
                                    url=post_data['url'],
                                    score=post_data['score'],
                                    num_comments=post_data['num_comments'],
                                    created_utc=post_data['created_utc']
                                )
                                
                                db.add(post)
                                db.commit()
                                total_posts_saved += 1
                        
                        except IntegrityError:
                            db.rollback()
                        except Exception as e:
                            db.rollback()
                            logger.error(f"Failed to save trending post: {str(e)}")
                
                subreddits_processed += 1
                
            except RedditAPIError as e:
                logger.error(f"Failed to process subreddit r/{subreddit}: {str(e)}")
                continue
        
        result = {
            'status': 'completed',
            'subreddits_processed': subreddits_processed,
            'total_posts_found': total_posts_found,
            'total_posts_saved': total_posts_saved
        }
        
        logger.info(f"Completed trending posts crawl: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Unexpected error during trending posts crawl: {str(e)}")
        return {
            'status': 'failed',
            'error': str(e)
        }
    
    finally:
        db.close()


@celery_app.task(bind=True)
def crawl_all_active_keywords(self) -> Dict[str, Any]:
    """
    Crawl posts for all active keywords.
    
    Returns:
        Dictionary with crawling results
    """
    db = get_db_session()
    
    try:
        logger.info("Starting crawl for all active keywords")
        
        # Get all active keywords
        active_keywords = db.query(Keyword).filter(Keyword.is_active == True).all()
        
        if not active_keywords:
            logger.info("No active keywords found")
            return {
                'status': 'completed',
                'keywords_processed': 0,
                'message': 'No active keywords found'
            }
        
        # Update task status
        current_task.update_state(
            state='PROGRESS',
            meta={
                'status': f'Found {len(active_keywords)} active keywords',
                'progress': 5
            }
        )
        
        # Process each keyword
        results = []
        for i, keyword in enumerate(active_keywords):
            try:
                # Update progress
                progress = 5 + (i / len(active_keywords)) * 90
                current_task.update_state(
                    state='PROGRESS',
                    meta={
                        'status': f'Processing keyword: {keyword.keyword}',
                        'progress': int(progress)
                    }
                )
                
                # Start crawl task for this keyword
                task_result = crawl_keyword_posts.delay(keyword.id, limit=50)
                results.append({
                    'keyword_id': keyword.id,
                    'keyword': keyword.keyword,
                    'task_id': task_result.id
                })
                
            except Exception as e:
                logger.error(f"Failed to start crawl for keyword {keyword.id}: {str(e)}")
                results.append({
                    'keyword_id': keyword.id,
                    'keyword': keyword.keyword,
                    'error': str(e)
                })
        
        result = {
            'status': 'completed',
            'keywords_processed': len(active_keywords),
            'crawl_tasks_started': len([r for r in results if 'task_id' in r]),
            'results': results
        }
        
        logger.info(f"Started crawl tasks for {len(active_keywords)} keywords")
        return result
        
    except Exception as e:
        logger.error(f"Unexpected error during bulk keyword crawl: {str(e)}")
        return {
            'status': 'failed',
            'error': str(e)
        }
    
    finally:
        db.close()


@celery_app.task
def cleanup_old_posts(days_old: int = 30) -> Dict[str, Any]:
    """
    Clean up old posts and comments to manage database size.
    
    Args:
        days_old: Delete posts older than this many days
        
    Returns:
        Dictionary with cleanup results
    """
    db = get_db_session()
    
    try:
        from datetime import timedelta
        
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_old)
        
        logger.info(f"Starting cleanup of posts older than {days_old} days")
        
        # Count posts to be deleted
        old_posts_count = db.query(Post).filter(
            Post.created_utc < cutoff_date
        ).count()
        
        # Delete old posts (comments will be deleted via cascade)
        deleted_posts = db.query(Post).filter(
            Post.created_utc < cutoff_date
        ).delete()
        
        db.commit()
        
        result = {
            'status': 'completed',
            'posts_deleted': deleted_posts,
            'cutoff_date': cutoff_date.isoformat()
        }
        
        logger.info(f"Cleanup completed: {result}")
        return result
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error during cleanup: {str(e)}")
        return {
            'status': 'failed',
            'error': str(e)
        }
    
    finally:
        db.close()