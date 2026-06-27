from pydantic import BaseModel
from typing import List
from datetime import datetime

# --- COMMENTS ---
class FeedCommentCreate(BaseModel):
    content: str

class FeedCommentResponse(BaseModel):
    id: int
    post_id: int
    user_id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- POSTS ---
class FeedPostCreate(BaseModel):
    teaching_segment: str | None = None
    content: str | None = None

class FeedPostResponse(BaseModel):
    id: int
    user_id: int
    teaching_segment: str | None
    content: str | None
    file_url: str | None = None  
    created_at: datetime
    likes_count: int = 0
    comments_count: int = 0

    class Config:
        from_attributes = True