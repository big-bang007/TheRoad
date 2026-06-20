from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime

from app.auth.admin_access import get_admin_user
from app.models.user import User
from app.database.connection import get_db

# 🧼 CLEAN & CORRECT: main.py will append /api/v1 automatically to create /api/v1/admin
router = APIRouter(prefix="/admin", tags=["Admin Control"])

@router.get("/dashboard")
async def get_admin_dashboard(admin: User = Depends(get_admin_user)):
    return {"message": "Welcome, Administrator."}

@router.get("/users")
async def get_all_user_profiles(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)  # 🛡️ Verified Admin Only
):
    """
    Fetches users from PostgreSQL and formats their learning progress safely 
    to be displayed inside the React AdminProfilesTab component.
    """
    try:
        stmt = select(User)
        result = await db.execute(stmt)
        users = result.scalars().all()
        
        profile_list = []
        
        for user in users:
            name = getattr(user, "name", getattr(user, "full_name", "Cozy Learner"))
            role = getattr(user, "role", "Learner")
            
            join_date = "Recently"
            if hasattr(user, "created_at") and user.created_at:
                join_date = user.created_at.strftime("%b %d, %Y")

            streak = getattr(user, "streak", 0)
            
            completed_lessons_data = []
            raw_lessons = getattr(user, "completed_lessons", getattr(user, "progress", []))
            
            if isinstance(raw_lessons, list):
                for lesson in raw_lessons:
                    memos = []
                    if hasattr(lesson, "voice_memos") and lesson.voice_memos:
                        for memo in lesson.voice_memos:
                            memos.append({
                                "id": str(getattr(memo, "id", "m")),
                                "title": getattr(memo, "title", "Voice Memo Submission"),
                                "url": getattr(memo, "url", ""),
                                "duration": getattr(memo, "duration", "0:25")
                            })
                    
                    completed_lessons_data.append({
                        "id": getattr(lesson, "id", 1),
                        "title": getattr(lesson, "title", getattr(lesson, "lesson_title", "Language Module")),
                        "score": int(getattr(lesson, "score", 100)),
                        "completedAt": lesson.completed_at.strftime("%b %d, %Y") if hasattr(lesson, "completed_at") and lesson.completed_at else datetime.now().strftime("%b %d, %Y"),
                        "voiceMemos": memos
                    })

            scores = [l["score"] for l in completed_lessons_data]
            avg_score = round(sum(scores) / len(scores)) if scores else 0

            profile_list.append({
                "id": str(user.id),
                "name": name,
                "role": role,
                "joinDate": join_date,
                "streak": int(streak) if streak else 0,
                "score": avg_score,
                "completedLessons": completed_lessons_data
            })

        print(f"📡 Admin Panel successfully delivered {len(profile_list)} user profiles.")
        return profile_list

    except Exception as e:
        print(f"❌ Error fetching admin profiles: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Could not compile user records database logs."
        )