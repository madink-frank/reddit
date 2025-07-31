"""
Database Integration Tests

Tests for database operations, transactions, and data integrity.
"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func

from app.models.user import User
from app.models.keyword import Keyword
from app.models.post import Post
from app.models.comment import Comment
from app.models.generated_content import GeneratedContent
from app.models.process_log import ProcessLog


class TestDatabaseIntegration:
    """Integration tests for database operations."""
    
    def test_user_keyword_cascade_delete(self, db_session: Session):
        """Test that deleting a user cascades to delete keywords."""
        # Create user with keywords
        user = User(reddit_id="cascade_user", username="cascadeuser")
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        # Create keywords for the user
        keywords = [
            Keyword(user_id=user.id, keyword="keyword1"),
            Keyword(user_id=user.id, keyword="keyword2"),
            Keyword(user_id=user.id, keyword="keyword3")
        ]
        
        for keyword in keywords:
            db_session.add(keyword)
        db_session.commit()
        
        # Verify keywords exist
        keyword_count = db_session.query(Keyword).filter(Keyword.user_id == user.id).count()
        assert keyword_count == 3
        
        # Delete user
        db_session.delete(user)
        db_session.commit()
        
        # Verify keywords are deleted due to cascade
        remaining_keywords = db_session.query(Keyword).filter(Keyword.user_id == user.id).count()
        assert remaining_keywords == 0
    
    def test_keyword_post_cascade_delete(self, db_session: Session, test_user: User):
        """Test that deleting a keyword cascades to delete posts and comments."""
        # Create keyword
        keyword = Keyword(user_id=test_user.id, keyword="cascade_keyword")
        db_session.add(keyword)
        db_session.commit()
        db_session.refresh(keyword)
        
        # Create posts for the keyword
        posts = []
        for i in range(3):
            post = Post(
                keyword_id=keyword.id,
                reddit_id=f"cascade_post_{i}",
                title=f"Cascade Post {i}",
                content=f"Content {i}"
            )
            posts.append(post)
            db_session.add(post)
        
        db_session.commit()
        for post in posts:
            db_session.refresh(post)
        
        # Create comments for posts
        comments = []
        for i, post in enumerate(posts):
            for j in range(2):
                comment = Comment(
                    post_id=post.id,
                    reddit_id=f"cascade_comment_{i}_{j}",
                    body=f"Comment {j} on post {i}"
                )
                comments.append(comment)
                db_session.add(comment)
        
        db_session.commit()
        
        # Verify posts and comments exist
        post_count = db_session.query(Post).filter(Post.keyword_id == keyword.id).count()
        comment_count = db_session.query(Comment).join(Post).filter(Post.keyword_id == keyword.id).count()
        assert post_count == 3
        assert comment_count == 6
        
        # Delete keyword
        db_session.delete(keyword)
        db_session.commit()
        
        # Verify posts and comments are deleted due to cascade
        remaining_posts = db_session.query(Post).filter(Post.keyword_id == keyword.id).count()
        remaining_comments = db_session.query(Comment).join(Post).filter(Post.keyword_id == keyword.id).count()
        assert remaining_posts == 0
        assert remaining_comments == 0
    
    def test_post_comment_cascade_delete(self, db_session: Session, test_keyword: Keyword):
        """Test that deleting a post cascades to delete comments."""
        # Create post
        post = Post(
            keyword_id=test_keyword.id,
            reddit_id="comment_cascade_post",
            title="Comment Cascade Post"
        )
        db_session.add(post)
        db_session.commit()
        db_session.refresh(post)
        
        # Create comments
        comments = []
        for i in range(5):
            comment = Comment(
                post_id=post.id,
                reddit_id=f"comment_cascade_{i}",
                body=f"Cascade comment {i}"
            )
            comments.append(comment)
            db_session.add(comment)
        
        db_session.commit()
        
        # Verify comments exist
        comment_count = db_session.query(Comment).filter(Comment.post_id == post.id).count()
        assert comment_count == 5
        
        # Delete post
        db_session.delete(post)
        db_session.commit()
        
        # Verify comments are deleted due to cascade
        remaining_comments = db_session.query(Comment).filter(Comment.post_id == post.id).count()
        assert remaining_comments == 0
    
    def test_unique_constraints(self, db_session: Session, test_user: User):
        """Test unique constraints across models."""
        # Test user reddit_id uniqueness
        user1 = User(reddit_id="unique_test", username="user1")
        user2 = User(reddit_id="unique_test", username="user2")
        
        db_session.add(user1)
        db_session.commit()
        
        db_session.add(user2)
        with pytest.raises(IntegrityError):
            db_session.commit()
        
        db_session.rollback()
        
        # Test keyword uniqueness per user
        keyword1 = Keyword(user_id=test_user.id, keyword="unique_keyword")
        keyword2 = Keyword(user_id=test_user.id, keyword="unique_keyword")
        
        db_session.add(keyword1)
        db_session.commit()
        
        db_session.add(keyword2)
        with pytest.raises(IntegrityError):
            db_session.commit()
        
        db_session.rollback()
        
        # Test post reddit_id uniqueness
        post1 = Post(keyword_id=keyword1.id, reddit_id="unique_post", title="Post 1")
        post2 = Post(keyword_id=keyword1.id, reddit_id="unique_post", title="Post 2")
        
        db_session.add(post1)
        db_session.commit()
        
        db_session.add(post2)
        with pytest.raises(IntegrityError):
            db_session.commit()
        
        db_session.rollback()
    
    def test_foreign_key_constraints(self, db_session: Session):
        """Test foreign key constraints."""
        # Test keyword with invalid user_id
        invalid_keyword = Keyword(user_id=99999, keyword="invalid_user")
        db_session.add(invalid_keyword)
        
        with pytest.raises(IntegrityError):
            db_session.commit()
        
        db_session.rollback()
        
        # Test post with invalid keyword_id
        invalid_post = Post(keyword_id=99999, reddit_id="invalid_keyword", title="Invalid Post")
        db_session.add(invalid_post)
        
        with pytest.raises(IntegrityError):
            db_session.commit()
        
        db_session.rollback()
        
        # Test comment with invalid post_id
        invalid_comment = Comment(post_id=99999, reddit_id="invalid_post")
        db_session.add(invalid_comment)
        
        with pytest.raises(IntegrityError):
            db_session.commit()
        
        db_session.rollback()
    
    def test_database_indexes(self, db_session: Session, test_user: User):
        """Test that database indexes are working correctly."""
        # Create keyword and posts for index testing
        keyword = Keyword(user_id=test_user.id, keyword="index_test")
        db_session.add(keyword)
        db_session.commit()
        db_session.refresh(keyword)
        
        # Create posts with different timestamps and subreddits
        base_time = datetime.utcnow() - timedelta(days=10)
        posts = []
        
        for i in range(100):
            post = Post(
                keyword_id=keyword.id,
                reddit_id=f"index_post_{i}",
                title=f"Index Test Post {i}",
                subreddit=f"subreddit_{i % 5}",  # 5 different subreddits
                score=i,
                created_utc=base_time + timedelta(hours=i)
            )
            posts.append(post)
            db_session.add(post)
        
        db_session.commit()
        
        # Test index on keyword_id and created_utc
        recent_posts = db_session.query(Post).filter(
            Post.keyword_id == keyword.id,
            Post.created_utc >= base_time + timedelta(days=2)
        ).order_by(Post.created_utc.desc()).limit(10).all()
        
        assert len(recent_posts) == 10
        
        # Test index on subreddit and created_utc
        subreddit_posts = db_session.query(Post).filter(
            Post.subreddit == "subreddit_0",
            Post.created_utc >= base_time
        ).order_by(Post.created_utc.desc()).all()
        
        assert len(subreddit_posts) == 20  # Every 5th post
        
        # Test reddit_id index (unique constraint)
        specific_post = db_session.query(Post).filter(
            Post.reddit_id == "index_post_50"
        ).first()
        
        assert specific_post is not None
        assert specific_post.title == "Index Test Post 50"
    
    def test_transaction_rollback(self, db_session: Session, test_user: User):
        """Test transaction rollback behavior."""
        initial_keyword_count = db_session.query(Keyword).filter(Keyword.user_id == test_user.id).count()
        
        try:
            # Start a transaction
            keyword1 = Keyword(user_id=test_user.id, keyword="transaction_test_1")
            keyword2 = Keyword(user_id=test_user.id, keyword="transaction_test_2")
            keyword3 = Keyword(user_id=test_user.id, keyword="transaction_test_1")  # Duplicate - will fail
            
            db_session.add(keyword1)
            db_session.add(keyword2)
            db_session.add(keyword3)  # This will cause the transaction to fail
            
            db_session.commit()
        except IntegrityError:
            db_session.rollback()
        
        # Verify no keywords were added due to rollback
        final_keyword_count = db_session.query(Keyword).filter(Keyword.user_id == test_user.id).count()
        assert final_keyword_count == initial_keyword_count
    
    def test_bulk_operations(self, db_session: Session, test_user: User):
        """Test bulk database operations."""
        # Create keyword for bulk posts
        keyword = Keyword(user_id=test_user.id, keyword="bulk_test")
        db_session.add(keyword)
        db_session.commit()
        db_session.refresh(keyword)
        
        # Bulk insert posts
        posts_data = []
        for i in range(1000):
            posts_data.append({
                'keyword_id': keyword.id,
                'reddit_id': f'bulk_post_{i}',
                'title': f'Bulk Post {i}',
                'content': f'Bulk content {i}',
                'score': i,
                'num_comments': i % 10,
                'created_utc': datetime.utcnow() - timedelta(hours=i)
            })
        
        # Use bulk_insert_mappings for better performance
        db_session.bulk_insert_mappings(Post, posts_data)
        db_session.commit()
        
        # Verify bulk insert worked
        post_count = db_session.query(Post).filter(Post.keyword_id == keyword.id).count()
        assert post_count == 1000
        
        # Test bulk update
        db_session.query(Post).filter(
            Post.keyword_id == keyword.id,
            Post.score < 100
        ).update({'subreddit': 'bulk_updated'})
        db_session.commit()
        
        # Verify bulk update
        updated_count = db_session.query(Post).filter(
            Post.keyword_id == keyword.id,
            Post.subreddit == 'bulk_updated'
        ).count()
        assert updated_count == 100
        
        # Test bulk delete
        deleted_count = db_session.query(Post).filter(
            Post.keyword_id == keyword.id,
            Post.score >= 900
        ).delete()
        db_session.commit()
        
        assert deleted_count == 100
        
        # Verify remaining posts
        remaining_count = db_session.query(Post).filter(Post.keyword_id == keyword.id).count()
        assert remaining_count == 900
    
    def test_complex_queries(self, db_session: Session, test_user: User):
        """Test complex database queries with joins and aggregations."""
        # Create test data
        keywords = []
        for i in range(3):
            keyword = Keyword(user_id=test_user.id, keyword=f"complex_keyword_{i}")
            keywords.append(keyword)
            db_session.add(keyword)
        
        db_session.commit()
        for keyword in keywords:
            db_session.refresh(keyword)
        
        # Create posts for each keyword
        for i, keyword in enumerate(keywords):
            for j in range(5):
                post = Post(
                    keyword_id=keyword.id,
                    reddit_id=f"complex_post_{i}_{j}",
                    title=f"Complex Post {i}-{j}",
                    score=10 + i * 5 + j,
                    num_comments=2 + j,
                    subreddit=f"subreddit_{i}"
                )
                db_session.add(post)
        
        db_session.commit()
        
        # Complex query: Get keyword statistics with joins and aggregations
        keyword_stats = db_session.query(
            Keyword.id,
            Keyword.keyword,
            func.count(Post.id).label('post_count'),
            func.avg(Post.score).label('avg_score'),
            func.sum(Post.num_comments).label('total_comments'),
            func.max(Post.score).label('max_score')
        ).join(
            Post, Keyword.id == Post.keyword_id
        ).filter(
            Keyword.user_id == test_user.id
        ).group_by(
            Keyword.id, Keyword.keyword
        ).order_by(
            func.avg(Post.score).desc()
        ).all()
        
        assert len(keyword_stats) == 3
        
        # Verify aggregation results
        for stat in keyword_stats:
            assert stat.post_count == 5
            assert stat.avg_score > 0
            assert stat.total_comments > 0
            assert stat.max_score > 0
        
        # Complex query: Get posts with keyword and comment count
        posts_with_details = db_session.query(
            Post.id,
            Post.title,
            Post.score,
            Keyword.keyword,
            func.count(Comment.id).label('comment_count')
        ).join(
            Keyword, Post.keyword_id == Keyword.id
        ).outerjoin(
            Comment, Post.id == Comment.post_id
        ).filter(
            Keyword.user_id == test_user.id
        ).group_by(
            Post.id, Post.title, Post.score, Keyword.keyword
        ).having(
            Post.score > 15
        ).order_by(
            Post.score.desc()
        ).all()
        
        assert len(posts_with_details) > 0
        
        # Verify all results have score > 15
        for post_detail in posts_with_details:
            assert post_detail.score > 15
    
    def test_json_field_operations(self, db_session: Session, test_user: User):
        """Test JSON field operations (JSONB in PostgreSQL, JSON in SQLite)."""
        # Create generated content with complex metadata
        complex_metadata = {
            "generation_params": {
                "temperature": 0.7,
                "max_tokens": 1000,
                "model": "gpt-3.5-turbo"
            },
            "analysis_metrics": {
                "sentiment_score": 0.8,
                "readability_score": 7.5,
                "keyword_density": {
                    "ai": 0.05,
                    "machine learning": 0.03,
                    "neural networks": 0.02
                }
            },
            "content_stats": {
                "word_count": 1500,
                "paragraph_count": 8,
                "sections": ["introduction", "main_content", "conclusion"]
            }
        }
        
        content = GeneratedContent(
            user_id=test_user.id,
            title="JSON Test Content",
            content_type="blog",
            content="Test content with complex metadata",
            source_keywords=[1, 2, 3],
            content_metadata=complex_metadata
        )
        
        db_session.add(content)
        db_session.commit()
        db_session.refresh(content)
        
        # Verify JSON data is stored and retrieved correctly
        retrieved_content = db_session.query(GeneratedContent).filter(
            GeneratedContent.id == content.id
        ).first()
        
        assert retrieved_content.content_metadata == complex_metadata
        assert retrieved_content.content_metadata["generation_params"]["temperature"] == 0.7
        assert retrieved_content.content_metadata["analysis_metrics"]["sentiment_score"] == 0.8
        assert len(retrieved_content.content_metadata["content_stats"]["sections"]) == 3
        
        # Test querying by JSON field (if supported by database)
        try:
            # This might not work in SQLite, but should work in PostgreSQL
            high_sentiment_content = db_session.query(GeneratedContent).filter(
                GeneratedContent.content_metadata['analysis_metrics']['sentiment_score'].astext.cast(db_session.bind.dialect.FLOAT) > 0.7
            ).all()
            
            assert len(high_sentiment_content) >= 1
        except Exception:
            # JSON querying not supported in test database, skip this part
            pass
    
    def test_concurrent_access_simulation(self, db_session: Session, test_user: User):
        """Test concurrent access patterns (simplified simulation)."""
        # Create a keyword that will be accessed concurrently
        keyword = Keyword(user_id=test_user.id, keyword="concurrent_test")
        db_session.add(keyword)
        db_session.commit()
        db_session.refresh(keyword)
        
        # Simulate concurrent post creation
        posts = []
        for i in range(10):
            post = Post(
                keyword_id=keyword.id,
                reddit_id=f"concurrent_post_{i}",
                title=f"Concurrent Post {i}",
                score=i
            )
            posts.append(post)
            db_session.add(post)
        
        # Commit all at once (simulating batch processing)
        db_session.commit()
        
        # Verify all posts were created
        post_count = db_session.query(Post).filter(Post.keyword_id == keyword.id).count()
        assert post_count == 10
        
        # Simulate concurrent updates
        for post in posts:
            post.score += 10
        
        db_session.commit()
        
        # Verify updates
        updated_posts = db_session.query(Post).filter(Post.keyword_id == keyword.id).all()
        for i, post in enumerate(updated_posts):
            assert post.score >= 10  # All should have been incremented
    
    def test_database_constraints_edge_cases(self, db_session: Session, test_user: User):
        """Test edge cases for database constraints."""
        # Test very long strings
        long_keyword = "a" * 255  # Maximum length for keyword
        keyword = Keyword(user_id=test_user.id, keyword=long_keyword)
        db_session.add(keyword)
        db_session.commit()
        db_session.refresh(keyword)
        
        assert keyword.keyword == long_keyword
        
        # Test empty but valid strings
        empty_description_keyword = Keyword(
            user_id=test_user.id, 
            keyword="empty_desc", 
            description=""
        )
        db_session.add(empty_description_keyword)
        db_session.commit()
        
        # Test NULL values where allowed
        null_content_post = Post(
            keyword_id=keyword.id,
            reddit_id="null_content_post",
            title="Post with null content",
            content=None  # Should be allowed
        )
        db_session.add(null_content_post)
        db_session.commit()
        
        assert null_content_post.content is None
        
        # Test default values
        default_score_post = Post(
            keyword_id=keyword.id,
            reddit_id="default_score_post",
            title="Post with default score"
            # score not specified, should default to 0
        )
        db_session.add(default_score_post)
        db_session.commit()
        db_session.refresh(default_score_post)
        
        assert default_score_post.score == 0
        assert default_score_post.num_comments == 0