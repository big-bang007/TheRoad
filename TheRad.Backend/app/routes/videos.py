from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.auth.dependencies import get_current_admin
from app.schemas.user import TokenUser
from app.schemas.video import VideoCreate, VideoResponse
from app.services.video import VideoService

# Notice we changed the tag to just "Videos" since Quizzes belong to Lessons now
router = APIRouter(prefix="/videos", tags=["Videos"])

# ==========================================
# 🛡️ ADMINISTRATIVE ROUTES
# ==========================================

@router.post("/", response_model=VideoResponse, status_code=status.HTTP_201_CREATED)
async def admin_upload_video(
    payload: VideoCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: TokenUser = Depends(get_current_admin)  # Blocks standard users
):
    """
    [Admin Only] Uploads a new educational video.
    Note: The payload must now include a 'lesson_id' so the database knows 
    which lesson this video belongs to!
    """
    # Changed from create_lesson to create_video to match its actual job
    return await VideoService.create_video(db, payload)