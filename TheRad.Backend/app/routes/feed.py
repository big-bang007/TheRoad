from fastapi import APIRouter, Depends, status, Form, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database.connection import get_db
from app.auth.dependencies import get_current_user
from app.schemas.user import TokenUser
from app.schemas.feed import FeedPostResponse, FeedCommentCreate, FeedCommentResponse
from app.services.feed import FeedService

router = APIRouter(prefix="/feed", tags=["Community Feed"])

# 👇 NEW HELPER: Safely handles Admin vs Student IDs across the whole file
def get_safe_user_id(sub_str: str) -> int:
    try:
        return int(sub_str)
    except ValueError:
        return 0  # 0 safely represents the Admin in the PostgreSQL database

@router.post("/posts", status_code=status.HTTP_201_CREATED)
async def publish_post(
    content: str = Form(None),
    teaching_segment: str = Form(None),
    file: UploadFile = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: TokenUser = Depends(get_current_user)
):
    """Publishes a standard text post, teaching segment, or media file to the feed."""
    
    # 🛡️ Uses the safe helper!
    user_id_num = get_safe_user_id(current_user.sub) 
    
    post = await FeedService.create_post(
        db=db, 
        user_id=user_id_num, 
        content=content, 
        teaching_segment=teaching_segment, 
        file=file
    )
    
    return {
        "id": post.id,
        "user_id": user_id_num,
        "user_full_name": current_user.full_name if hasattr(current_user, 'full_name') else f"User #{user_id_num}",
        "teaching_segment": post.teaching_segment,
        "content": post.content,
        "file_url": post.file_url,
        "created_at": post.created_at,
        "likes_count": 0,
        "comments_count": 0
    }

@router.get("/posts", response_model=List[FeedPostResponse])
async def get_feed(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: TokenUser = Depends(get_current_user)
):
    """Retrieves all feed posts ordered by newest."""
    return await FeedService.get_all_posts(db, skip, limit)

@router.post("/posts/{post_id}/like")
async def toggle_like_post(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: TokenUser = Depends(get_current_user)
):
    """Likes or unlikes a post."""
    # 🛡️ Uses the safe helper!
    return await FeedService.toggle_like(db, str(get_safe_user_id(current_user.sub)), post_id)

@router.post("/posts/{post_id}/comments", response_model=FeedCommentResponse, status_code=status.HTTP_201_CREATED)
async def comment_on_post(
    post_id: int,
    payload: FeedCommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: TokenUser = Depends(get_current_user)
):
    """Adds a comment to a specific feed post."""
    # 🛡️ Uses the safe helper!
    return await FeedService.add_comment(db, str(get_safe_user_id(current_user.sub)), post_id, payload)

@router.get("/posts/{post_id}/comments", response_model=List[FeedCommentResponse])
async def get_post_comments(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: TokenUser = Depends(get_current_user)
):
    """Retrieves all chronological comments for a specific post."""
    return await FeedService.get_comments(db, post_id)