from pydantic import BaseModel
from datetime import datetime

class ProgressResponse(BaseModel):
    video_id: int
    is_completed: bool
    updated_at: datetime
    class Config:
        from_attributes = True

class VoiceMemoResponse(BaseModel):
    id: int
    video_id: int
    file_path: str
    uploaded_at: datetime
    class Config:
        from_attributes = True