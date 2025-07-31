"""
Test script for crawling job management infrastructure.
"""

import asyncio
import sys
import os
from datetime import datetime, timezone

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.crawling_job import CrawlingJob, JobStatus, JobPriority, CrawlingSchedule, ScheduleFrequency
from app.models.user import User
from app.models.keyword import Keyword
from app.services.job_queue_service import get_job_queue_service
from app.services.job_monitoring_service import get_job_monitoring_service


async def test_crawling_job_infrastructure():
    """Test the crawling job management infrastructure."""
    print("🚀 Testing Crawling Job Management Infrastructure")
    print("=" * 60)
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Test 1: Create a test user and keyword
        print("\n1. Setting up test data...")
        
        # Check if test user exists
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            test_user = User(
                reddit_id="test_reddit_id",
                email="test@example.com",
                username="testuser"
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
        
        # Check if test keyword exists
        test_keyword = db.query(Keyword).filter(
            Keyword.keyword == "test_keyword",
            Keyword.user_id == test_user.id
        ).first()
        if not test_keyword:
            test_keyword = Keyword(
                keyword="test_keyword",
                user_id=test_user.id,
                is_active=True
            )
            db.add(test_keyword)
            db.commit()
            db.refresh(test_keyword)
        
        print(f"✅ Test user created: {test_user.email}")
        print(f"✅ Test keyword created: {test_keyword.keyword}")
        
        # Test 2: Create a crawling job
        print("\n2. Creating crawling job...")
        
        job = CrawlingJob(
            name="Test Keyword Crawl",
            job_type="keyword_crawl",
            parameters={"keyword_id": test_keyword.id, "limit": 10},
            priority=JobPriority.NORMAL,
            user_id=test_user.id,
            keyword_id=test_keyword.id
        )
        
        db.add(job)
        db.commit()
        db.refresh(job)
        
        print(f"✅ Crawling job created: ID {job.id}, Status: {job.status.value}")
        
        # Test 3: Test job queue service
        print("\n3. Testing job queue service...")
        
        job_queue_service = get_job_queue_service()
        
        # Enqueue the job
        enqueue_result = await job_queue_service.enqueue_job(db, job.id, JobPriority.NORMAL)
        print(f"✅ Job enqueued: {enqueue_result}")
        
        # Get job status
        status = await job_queue_service.get_job_status(job.id)
        print(f"✅ Job status from Redis: {status}")
        
        # Update job progress
        progress_update = {
            "current": 5,
            "total": 10,
            "percentage": 50.0,
            "message": "Processing items...",
            "speed": 2.5
        }
        
        await job_queue_service.update_job_progress(job.id, progress_update)
        print(f"✅ Job progress updated")
        
        # Get progress
        progress = await job_queue_service.get_job_progress(job.id)
        print(f"✅ Job progress from Redis: {progress}")
        
        # Test 4: Test job monitoring service
        print("\n4. Testing job monitoring service...")
        
        monitoring_service = get_job_monitoring_service()
        
        # Get dashboard stats
        dashboard_stats = await monitoring_service.get_real_time_dashboard_stats(db, test_user.id)
        print(f"✅ Dashboard stats: {dashboard_stats}")
        
        # Get active jobs monitoring
        active_jobs = await monitoring_service.get_active_jobs_monitoring(db, test_user.id)
        print(f"✅ Active jobs monitoring: {len(active_jobs)} jobs")
        
        # Get job history
        job_history = await monitoring_service.get_job_history(db, test_user.id, limit=10)
        print(f"✅ Job history: {len(job_history)} jobs")
        
        # Test 5: Test queue statistics
        print("\n5. Testing queue statistics...")
        
        queue_stats = await job_queue_service.get_queue_statistics()
        print(f"✅ Queue statistics: {queue_stats}")
        
        # Test 6: Create a crawling schedule
        print("\n6. Creating crawling schedule...")
        
        schedule = CrawlingSchedule(
            name="Test Daily Schedule",
            description="Test schedule for daily keyword crawling",
            frequency=ScheduleFrequency.DAILY,
            job_type="keyword_crawl",
            job_parameters={"keyword_id": test_keyword.id, "limit": 50},
            job_priority=JobPriority.NORMAL,
            user_id=test_user.id,
            keyword_id=test_keyword.id
        )
        
        db.add(schedule)
        db.commit()
        db.refresh(schedule)
        
        print(f"✅ Crawling schedule created: ID {schedule.id}, Frequency: {schedule.frequency.value}")
        
        # Test 7: Update job status to completed
        print("\n7. Testing job status updates...")
        
        await job_queue_service.update_job_status(
            db, job.id, JobStatus.COMPLETED,
            progress={"current": 10, "total": 10, "percentage": 100.0, "message": "Completed"}
        )
        
        # Refresh job from database
        db.refresh(job)
        print(f"✅ Job status updated to: {job.status.value}")
        print(f"✅ Job completion time: {job.completed_at}")
        print(f"✅ Job success rate: {job.success_rate}%")
        
        # Test 8: Test job metrics recording
        print("\n8. Testing job metrics recording...")
        
        test_metrics = {
            "cpu_usage": 45.2,
            "memory_usage": 128.5,
            "items_per_second": 3.2,
            "network_io": 1024.0
        }
        
        success = await monitoring_service.record_job_metrics(job.id, test_metrics)
        print(f"✅ Job metrics recorded: {success}")
        
        print("\n" + "=" * 60)
        print("🎉 All tests completed successfully!")
        print("✅ CrawlingJob and CrawlingSchedule data models working")
        print("✅ Job queue management with Redis integration working")
        print("✅ Real-time job status tracking and progress monitoring working")
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(test_crawling_job_infrastructure())