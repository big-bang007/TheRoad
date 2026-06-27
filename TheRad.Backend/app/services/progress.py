from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import UploadFile
from app.models.progress import ProgressTrack, VoiceMemo
from app.models.user import User
from app.storage.base import storage_provider
from app.models.lesson import Lesson
# Assuming your schemas are updated to match the 6-section structure
from app.schemas.quiz import LessonCreate 

class ProgressService:
    @staticmethod
    async def ensure_user_exists(db: AsyncSession, user_id: int, email: str):
        """Ensures that users verified through external tokens have a local footprint."""
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            user = User(id=user_id, email=email)
            db.add(user)
            await db.flush()

    @staticmethod 
    async def update_progress(db: AsyncSession, user_id: int, lesson_id: int, is_completed: bool) -> ProgressTrack:
        """Tracks completion status for a lesson."""
        result = await db.execute(
            select(ProgressTrack).where(
                ProgressTrack.user_id == user_id, 
                ProgressTrack.lesson_id == lesson_id
            )
        )
        track = result.scalar_one_or_none()
        
        if not track:
            track = ProgressTrack(user_id=user_id, lesson_id=lesson_id, is_completed=is_completed)
            db.add(track)
        else:
            track.is_completed = is_completed
            
        await db.flush()
        return track

    @staticmethod
    async def handle_voice_upload(db: AsyncSession, user_id: int, lesson_id: int, file: UploadFile) -> VoiceMemo:
        """Saves a voice memo associated with a specific lesson."""
        # Save file via storage abstraction layer
        saved_path = await storage_provider.save_file(file, sub_folder=f"user_{user_id}")
        
        memo = VoiceMemo(user_id=user_id, lesson_id=lesson_id, file_path=saved_path)
        db.add(memo)
        await db.flush()
        return memo