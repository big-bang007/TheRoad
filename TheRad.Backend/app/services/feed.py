from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.models.feed import FeedPost, FeedComment, FeedLike
from app.schemas.feed import FeedPostCreate, FeedCommentCreate
import os
import uuid
import shutil
from fastapi import UploadFile, HTTPException

UPLOAD_DIR = "uploads/feed"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class FeedService:
    @staticmethod
    async def create_post(db: AsyncSession, user_id: int, content: str = None, teaching_segment: str = None, file: UploadFile = None) -> FeedPost:
        
        if not content and not teaching_segment and not file:
            raise HTTPException(status_code=400, detail="Post must contain text, a segment, or media.")

        file_url = None
        
        if file:
            # Generate a unique random filename (e.g., 5f4dcc3b5aa765d61d8327deb882cf99.jpg)
            ext = file.filename.split('.')[-1]
            filename = f"{uuid.uuid4().hex}.{ext}"
            filepath = os.path.join(UPLOAD_DIR, filename)
            
            # Save the file to the hard drive
            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
            # The URL path that the frontend will use to fetch the image
            file_url = f"/uploads/feed/{filename}"

        new_post = FeedPost(
            user_id=user_id, 
            teaching_segment=teaching_segment,
            content=content,
            file_url=file_url
        )
        
        db.add(new_post)
        await db.commit()
        await db.refresh(new_post)
        return new_post
    @staticmethod
    async def get_all_posts(db: AsyncSession, skip: int = 0, limit: int = 20):
        stmt = select(FeedPost).order_by(FeedPost.created_at.desc()).offset(skip).limit(limit).options(
            selectinload(FeedPost.likes),
            selectinload(FeedPost.comments)
        )
        result = await db.execute(stmt)
        posts = result.scalars().all()
        
        response = []
        for post in posts:
            response.append({
                "id": post.id,
                "user_id": post.user_id,
                "teaching_segment": post.teaching_segment,
                "content": post.content,
                "file_url": post.file_url,
                "created_at": post.created_at,
                "likes_count": len(post.likes),
                "comments_count": len(post.comments)
            })
        return response

    @staticmethod
    async def toggle_like(db: AsyncSession, user_id: str, post_id: int):
        # 1. Verify post exists
        post_stmt = select(FeedPost).where(FeedPost.id == post_id)
        post_result = await db.execute(post_stmt)
        if not post_result.scalars().first():
            raise HTTPException(status_code=404, detail="Post not found")

        # 2. Check if user already liked it
        stmt = select(FeedLike).where(FeedLike.post_id == post_id, FeedLike.user_id == user_id)
        result = await db.execute(stmt)
        existing_like = result.scalars().first()

        if existing_like:
            await db.delete(existing_like)
            await db.commit()
            return {"message": "Post unliked", "liked": False}
        else:
            new_like = FeedLike(post_id=post_id, user_id=user_id)
            db.add(new_like)
            await db.commit()
            return {"message": "Post liked", "liked": True}

    @staticmethod
    async def add_comment(db: AsyncSession, user_id: str, post_id: int, payload: FeedCommentCreate):
        post_stmt = select(FeedPost).where(FeedPost.id == post_id)
        post_result = await db.execute(post_stmt)
        if not post_result.scalars().first():
            raise HTTPException(status_code=404, detail="Post not found")

        new_comment = FeedComment(post_id=post_id, user_id=user_id, content=payload.content)
        db.add(new_comment)
        await db.commit()
        await db.refresh(new_comment)
        return new_comment
        
    @staticmethod
    async def get_comments(db: AsyncSession, post_id: int):
        stmt = select(FeedComment).where(FeedComment.post_id == post_id).order_by(FeedComment.created_at.asc())
        result = await db.execute(stmt)
        return result.scalars().all()