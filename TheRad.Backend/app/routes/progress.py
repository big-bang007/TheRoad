from fastapi import APIRouter, Depends, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.auth.dependencies import get_current_user
from app.schemas.user import TokenUser
# Ensure these schemas exist or adjust to match your new return structures
from app.schemas.progress import ProgressResponse, VoiceMemoResponse
from app.services.progress import ProgressService

router = APIRouter(prefix="/progress", tags=["Progress & Voice Management"])

@router.patch("/lesson/{lesson_id}", response_model=ProgressResponse)
async def update_lesson_progress(
    lesson_id: int,
    is_completed: bool,
    db: AsyncSession = Depends(get_db),
    current_user: TokenUser = Depends(get_current_user)
):
    """Updates completion status for a lesson."""
    await ProgressService.ensure_user_exists(db, current_user.id, current_user.email)
    track = await ProgressService.update_progress(db, current_user.id, lesson_id, is_completed)
    await db.commit() # Don't forget to commit the changes!
    return track

@router.post("/lesson/{lesson_id}/voice", response_model=VoiceMemoResponse, status_code=status.HTTP_201_CREATED)
async def upload_voice_memo(
    lesson_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: TokenUser = Depends(get_current_user)
):
    """Uploads a voice memo specifically for a lesson."""
    await ProgressService.ensure_user_exists(db, current_user.id, current_user.email)
    memo = await ProgressService.handle_voice_upload(db, current_user.id, lesson_id, file)
    await db.commit() # Don't forget to commit the changes!
    return memo