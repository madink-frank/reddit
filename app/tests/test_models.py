"""
Tests for Database Models

Unit tests for model validation and relationships.
"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.user import User
from app.models.keyword import Keyword
from app.models.post import Post
from app.models.comment import Comment
from app.models.generated_content import GeneratedContent
from app.models.process_log import ProcessLog


class TestUserModel:
    """Test cases for User model."""
    
    def test_create_user_valid(self, db_session: Session):
        """Test creating a valid user."""
        user = User(
            reddit_id="test_reddit_123",
            username="testuser",
            email="test@example.com",
            is_active=True
        )
        
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        assert user.id is not None
        assert user.reddit_id == "test_reddit_123"
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.is_active is True
        assert user.created_at is not None
        assert user.updated_at is not None
    
    def test_create_user_minimal(self, db_session: Session):
        """Test creating user with minimal required fields."""
        user = User(
            reddit_id="minimal_user",
            username="minimal"
        )
        
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        assert user.id is not None
        assert user.reddit_id == "minimal_user"
        assert user.username == "minimal"
        assert user.email is None
        assert user.is_active is True  # Default value
    
    def test_user_reddit_id_unique(self, db_session: Session):
        """Test that reddit_id must be unique."""
        user1 = User(reddit_id="duplicate", username="user1")
        user2 = User(reddit_id="duplicate", username="user2")
        
        db_session.add(user1)
        db_session.commit()
        
        db_session.add(user2)
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_user_reddit_id_required(self, db_session: Session):
        """Test that reddit_id is required."""
        user = User(username="noredditid")
        
        db_session.add(user)
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_user_username_required(self, db_session: Session):
        """Test that username is required."""
        user = User(reddit_id="nousername")
        
        db_session.add(user)
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_user_relationships(self, db_session: Session):
        """Test user model relationships."""
        user = User(reddit_id="rel_test", username="reluser")
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        # Test keywords relationship
        keyword = Keyword(user_id=user.id, keyword="test keyword")
        db_session.add(keyword)
        db_session.commit()
        
        assert len(user.keywords) == 1
        assert user.keywords[0].keyword == "test keyword"
        
        # Test cascade delete
        db_session.delete(user)
        db_session.commit()
        
        # Keyword should be deleted due to cascade
        remaining_keywords = db_session.query(Keyword).filter(Keyword.user_id == user.id).all()
        assert len(remaining_keywords) == 0


class TestKeywordModel:
    """Test cases for Keyword model."""
    
    def test_create_keyword_valid(self, db_session: Session, test_user: User):
        """Test creating a valid keyword."""
        keyword = Keyword(
            user_id=test_user.id,
            keyword="python programming",
            description="Python programming language",
            is_active=True
        )
        
        db_session.add(keyword)
        db_session.commit()
        db_session.refresh(keyword)
        
        assert keyword.id is not None
        assert keyword.user_id == test_user.id
        assert keyword.keyword == "python programming"
        assert keyword.description == "Python programming language"
        assert keyword.is_active is True
        assert keyword.created_at is not None
        assert keyword.updated_at is not None
    
    def test_create_keyword_minimal(self, db_session: Session, test_user: User):
        """Test creating keyword with minimal fields."""
        keyword = Keyword(
            user_id=test_user.id,
            keyword="minimal"
        )
        
        db_session.add(keyword)
        db_session.commit()
        db_session.refresh(keyword)
        
        assert keyword.id is not None
        assert keyword.keyword == "minimal"
        assert keyword.description is None
        assert keyword.is_active is True  # Default value
    
    def test_keyword_user_keyword_unique(self, db_session: Session, test_user: User):
        """Test that user_id + keyword combination must be unique."""
        keyword1 = Keyword(user_id=test_user.id, keyword="duplicate")
        keyword2 = Keyword(user_id=test_user.id, keyword="duplicate")
        
        db_session.add(keyword1)
        db_session.commit()
        
        db_session.add(keyword2)
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_keyword_different_users_same_keyword(self, db_session: Session, test_user: User, test_user_2: User):
        """Test that different users can have the same keyword."""
        keyword1 = Keyword(user_id=test_user.id, keyword="shared")
        keyword2 = Keyword(user_id=test_user_2.id, keyword="shared")
        
        db_session.add(keyword1)
        db_session.add(keyword2)
        db_session.commit()
        
        # Should not raise an exception
        assert keyword1.id != keyword2.id
        assert keyword1.keyword == keyword2.keyword
    
    def test_keyword_user_id_required(self, db_session: Session):
        """Test that user_id is required."""
        keyword = Keyword(keyword="no user")
        
        db_session.add(keyword)
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_keyword_text_required(self, db_session: Session, test_user: User):
        """Test that keyword text is required."""
        keyword = Keyword(user_id=test_user.id)
        
        db_session.add(keyword)
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_keyword_user_relationship(self, db_session: Session, test_user: User):
        """Test keyword-user relationship."""
        keyword = Keyword(user_id=test_user.id, keyword="relationship test")
        db_session.add(keyword)
        db_session.commit()
        db_session.refresh(keyword)
        
        assert keyword.user is not None
        assert keyword.user.id == test_user.id
        assert keyword.user.username == test_user.username


class TestPostModel:
    """Test cases for Post model."""
    
    def test_create_post_valid(self, db_session: Session, test_keyword: Keyword):
        """Test creating a valid post."""
        post = Post(
            keyword_id=test_keyword.id,
            reddit_id="test_post_123",
            title="Test Post Title",
            content="This is test post content",
            author="testauthor",
            subreddit="testsubreddit",
            url="https://reddit.com/r/test/post123",
            score=42,
            num_comments=10,
            created_utc=datetime.utcnow()
        )
        
        db_session.add(post)
        db_session.commit()
        db_session.refresh(post)
        
        assert post.id is not None
        assert post.keyword_id == test_keyword.id
        assert post.reddit_id == "test_post_123"
        assert post.title == "Test Post Title"
        assert post.content == "This is test post content"
        assert post.author == "testauthor"
        assert post.subreddit == "testsubreddit"
        assert post.score == 42
        assert post.num_comments == 10
        assert post.crawled_at is not None
    
    def test_create_post_minimal(self, db_session: Session, test_keyword: Keyword):
        """Test creating post with minimal required fields."""
        post = Post(
            keyword_id=test_keyword.id,
            reddit_id="minimal_post",
            title="Minimal Post"
        )
        
        db_session.add(post)
        db_session.commit()
        db_session.refresh(post)
        
        assert post.id is not None
        assert post.reddit_id == "minimal_post"
        assert post.title == "Minimal Post"
        assert post.content is None
        assert post.score == 0  # Default value
        assert post.num_comments == 0  # Default value
    
    def test_post_reddit_id_unique(self, db_session: Session, test_keyword: Keyword):
        """Test that reddit_id must be unique."""
        post1 = Post(keyword_id=test_keyword.id, reddit_id="duplicate", title="Post 1")
        post2 = Post(keyword_id=test_keyword.id, reddit_id="duplicate", title="Post 2")
        
        db_session.add(post1)
        db_session.commit()
        
        db_session.add(post2)
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_post_keyword_id_required(self, db_session: Session):
        """Test that keyword_id is required."""
        post = Post(reddit_id="no_keyword", title="No Keyword Post")
        
        db_session.add(post)
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_post_reddit_id_required(self, db_session: Session, test_keyword: Keyword):
        """Test that reddit_id is required."""
        post = Post(keyword_id=test_keyword.id, title="No Reddit ID")
        
        db_session.add(post)
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_post_title_required(self, db_session: Session, test_keyword: Keyword):
        """Test that title is required."""
        post = Post(keyword_id=test_keyword.id, reddit_id="no_title")
        
        db_session.add(post)
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_post_keyword_relationship(self, db_session: Session, test_keyword: Keyword):
        """Test post-keyword relationship."""
        post = Post(
            keyword_id=test_keyword.id,
            reddit_id="rel_test",
            title="Relationship Test"
        )
        db_session.add(post)
        db_session.commit()
        db_session.refresh(post)
        
        assert post.keyword is not None
        assert post.keyword.id == test_keyword.id
        assert post.keyword.keyword == test_keyword.keyword
    
    def test_post_cascade_delete(self, db_session: Session, test_user: User):
        """Test that posts are deleted when keyword is deleted."""
        # Create keyword and post
        keyword = Keyword(user_id=test_user.id, keyword="cascade test")
        db_session.add(keyword)
        db_session.commit()
        db_session.refresh(keyword)
        
        post = Post(keyword_id=keyword.id, reddit_id="cascade_post", title="Cascade Test")
        db_session.add(post)
        db_session.commit()
        
        # Delete keyword
        db_session.delete(keyword)
        db_session.commit()
        
        # Post should be deleted due to cascade
        remaining_posts = db_session.query(Post).filter(Post.keyword_id == keyword.id).all()
        assert len(remaining_posts) == 0


class TestCommentModel:
    """Test cases for Comment model."""
    
    def test_create_comment_valid(self, db_session: Session, test_keyword: Keyword):
        """Test creating a valid comment."""
        # Create post first
        post = Post(keyword_id=test_keyword.id, reddit_id="comment_post", title="Comment Test Post")
        db_session.add(post)
        db_session.commit()
        db_session.refresh(post)
        
        comment = Comment(
            post_id=post.id,
            reddit_id="test_comment_123",
            body="This is a test comment",
            author="commentauthor",
            score=5,
            created_utc=datetime.utcnow()
        )
        
        db_session.add(comment)
        db_session.commit()
        db_session.refresh(comment)
        
        assert comment.id is not None
        assert comment.post_id == post.id
        assert comment.reddit_id == "test_comment_123"
        assert comment.body == "This is a test comment"
        assert comment.author == "commentauthor"
        assert comment.score == 5
        assert comment.crawled_at is not None
    
    def test_create_comment_minimal(self, db_session: Session, test_keyword: Keyword):
        """Test creating comment with minimal fields."""
        post = Post(keyword_id=test_keyword.id, reddit_id="minimal_comment_post", title="Minimal Comment Post")
        db_session.add(post)
        db_session.commit()
        db_session.refresh(post)
        
        comment = Comment(
            post_id=post.id,
            reddit_id="minimal_comment"
        )
        
        db_session.add(comment)
        db_session.commit()
        db_session.refresh(comment)
        
        assert comment.id is not None
        assert comment.reddit_id == "minimal_comment"
        assert comment.body is None
        assert comment.score == 0  # Default value
    
    def test_comment_reddit_id_unique(self, db_session: Session, test_keyword: Keyword):
        """Test that comment reddit_id must be unique."""
        post = Post(keyword_id=test_keyword.id, reddit_id="dup_comment_post", title="Duplicate Comment Post")
        db_session.add(post)
        db_session.commit()
        db_session.refresh(post)
        
        comment1 = Comment(post_id=post.id, reddit_id="duplicate_comment")
        comment2 = Comment(post_id=post.id, reddit_id="duplicate_comment")
        
        db_session.add(comment1)
        db_session.commit()
        
        db_session.add(comment2)
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_comment_post_relationship(self, db_session: Session, test_keyword: Keyword):
        """Test comment-post relationship."""
        post = Post(keyword_id=test_keyword.id, reddit_id="rel_comment_post", title="Relationship Comment Post")
        db_session.add(post)
        db_session.commit()
        db_session.refresh(post)
        
        comment = Comment(post_id=post.id, reddit_id="rel_comment")
        db_session.add(comment)
        db_session.commit()
        db_session.refresh(comment)
        
        assert comment.post is not None
        assert comment.post.id == post.id
        assert comment.post.title == post.title
    
    def test_comment_cascade_delete(self, db_session: Session, test_keyword: Keyword):
        """Test that comments are deleted when post is deleted."""
        post = Post(keyword_id=test_keyword.id, reddit_id="cascade_comment_post", title="Cascade Comment Post")
        db_session.add(post)
        db_session.commit()
        db_session.refresh(post)
        
        comment = Comment(post_id=post.id, reddit_id="cascade_comment")
        db_session.add(comment)
        db_session.commit()
        
        # Delete post
        db_session.delete(post)
        db_session.commit()
        
        # Comment should be deleted due to cascade
        remaining_comments = db_session.query(Comment).filter(Comment.post_id == post.id).all()
        assert len(remaining_comments) == 0


class TestGeneratedContentModel:
    """Test cases for GeneratedContent model."""
    
    def test_create_generated_content_valid(self, db_session: Session, test_user: User):
        """Test creating valid generated content."""
        content = GeneratedContent(
            user_id=test_user.id,
            title="Test Generated Content",
            content_type="blog",
            content="This is generated blog content about trending topics.",
            template_used="blog_template_v1",
            source_keywords=[1, 2, 3],
            content_metadata={
                "word_count": 150,
                "sections": ["intro", "main", "conclusion"],
                "confidence_score": 0.85
            }
        )
        
        db_session.add(content)
        db_session.commit()
        db_session.refresh(content)
        
        assert content.id is not None
        assert content.user_id == test_user.id
        assert content.title == "Test Generated Content"
        assert content.content_type == "blog"
        assert content.content == "This is generated blog content about trending topics."
        assert content.template_used == "blog_template_v1"
        assert content.source_keywords == [1, 2, 3]
        assert content.content_metadata["word_count"] == 150
        assert content.created_at is not None
    
    def test_create_generated_content_minimal(self, db_session: Session, test_user: User):
        """Test creating generated content with minimal fields."""
        content = GeneratedContent(
            user_id=test_user.id,
            title="Minimal Content",
            content_type="product_intro",
            content="Minimal content.",
            source_keywords=[1]
        )
        
        db_session.add(content)
        db_session.commit()
        db_session.refresh(content)
        
        assert content.id is not None
        assert content.title == "Minimal Content"
        assert content.content_type == "product_intro"
        assert content.template_used is None
        assert content.content_metadata is None
    
    def test_generated_content_title_required(self, db_session: Session, test_user: User):
        """Test that title is required."""
        content = GeneratedContent(
            user_id=test_user.id,
            content_type="blog",
            content="Content without title",
            source_keywords=[1]
        )
        
        db_session.add(content)
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_generated_content_type_required(self, db_session: Session, test_user: User):
        """Test that content_type is required."""
        content = GeneratedContent(
            user_id=test_user.id,
            title="No Type Content",
            content="Content without type",
            source_keywords=[1]
        )
        
        db_session.add(content)
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_generated_content_required(self, db_session: Session, test_user: User):
        """Test that content is required."""
        content = GeneratedContent(
            user_id=test_user.id,
            title="No Content",
            content_type="blog",
            source_keywords=[1]
        )
        
        db_session.add(content)
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_generated_content_source_keywords_required(self, db_session: Session, test_user: User):
        """Test that source_keywords is required."""
        content = GeneratedContent(
            user_id=test_user.id,
            title="No Keywords",
            content_type="blog",
            content="Content without keywords"
        )
        
        db_session.add(content)
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_generated_content_user_relationship(self, db_session: Session, test_user: User):
        """Test generated content-user relationship."""
        content = GeneratedContent(
            user_id=test_user.id,
            title="Relationship Test",
            content_type="trend_analysis",
            content="Relationship test content",
            source_keywords=[1]
        )
        db_session.add(content)
        db_session.commit()
        db_session.refresh(content)
        
        assert content.user is not None
        assert content.user.id == test_user.id
        assert content.user.username == test_user.username
    
    def test_generated_content_metadata_json(self, db_session: Session, test_user: User):
        """Test that metadata is properly stored as JSON."""
        complex_metadata = {
            "generation_params": {
                "temperature": 0.7,
                "max_tokens": 1000,
                "custom_prompt": "Focus on technical aspects"
            },
            "analysis_metrics": {
                "sentiment_score": 0.6,
                "readability_score": 8.5,
                "keyword_density": {"python": 0.05, "ai": 0.03}
            },
            "marketing_points": [
                "Trending technology",
                "High engagement",
                "Growing community"
            ]
        }
        
        content = GeneratedContent(
            user_id=test_user.id,
            title="Complex Metadata Test",
            content_type="blog",
            content="Content with complex metadata",
            source_keywords=[1, 2],
            content_metadata=complex_metadata
        )
        
        db_session.add(content)
        db_session.commit()
        db_session.refresh(content)
        
        # Verify metadata is properly stored and retrieved
        assert content.content_metadata == complex_metadata
        assert content.content_metadata["generation_params"]["temperature"] == 0.7
        assert len(content.content_metadata["marketing_points"]) == 3


class TestProcessLogModel:
    """Test cases for ProcessLog model."""
    
    def test_create_process_log_valid(self, db_session: Session, test_user: User):
        """Test creating a valid process log."""
        log = ProcessLog(
            user_id=test_user.id,
            process_type="crawling",
            status="running",
            details={
                "keyword_id": 1,
                "subreddit": "python",
                "posts_found": 25
            }
        )
        
        db_session.add(log)
        db_session.commit()
        db_session.refresh(log)
        
        assert log.id is not None
        assert log.user_id == test_user.id
        assert log.process_type == "crawling"
        assert log.status == "running"
        assert log.details["keyword_id"] == 1
        assert log.started_at is not None
        assert log.completed_at is None
    
    def test_create_process_log_minimal(self, db_session: Session, test_user: User):
        """Test creating process log with minimal fields."""
        log = ProcessLog(
            user_id=test_user.id,
            process_type="content_generation",
            status="completed"
        )
        
        db_session.add(log)
        db_session.commit()
        db_session.refresh(log)
        
        assert log.id is not None
        assert log.process_type == "content_generation"
        assert log.status == "completed"
        assert log.details is None
        assert log.error_message is None
    
    def test_process_log_user_relationship(self, db_session: Session, test_user: User):
        """Test process log-user relationship."""
        log = ProcessLog(
            user_id=test_user.id,
            process_type="analytics",
            status="completed"
        )
        db_session.add(log)
        db_session.commit()
        db_session.refresh(log)
        
        assert log.user is not None
        assert log.user.id == test_user.id
        assert log.user.username == test_user.username
    
    def test_process_log_status_values(self, db_session: Session, test_user: User):
        """Test different status values."""
        statuses = ["running", "completed", "failed", "cancelled"]
        
        for status in statuses:
            log = ProcessLog(
                user_id=test_user.id,
                process_type="test",
                status=status
            )
            db_session.add(log)
        
        db_session.commit()
        
        # All logs should be created successfully
        logs = db_session.query(ProcessLog).filter(ProcessLog.user_id == test_user.id).all()
        assert len(logs) == len(statuses)
        
        log_statuses = [log.status for log in logs]
        for status in statuses:
            assert status in log_statuses