from pydantic import BaseModel, Field
from typing import List, Optional
from pydantic import BaseModel
from typing import Optional

class VideoBase(BaseModel):
    title: str
    description: Optional[str] = None
    file_path: str  # Direct server storage path or local static folder link

class VideoCreate(VideoBase):
    pass  # Used for incoming POST validation parsing

class VideoResponse(VideoBase):
    id: int

    model_config = {"from_attributes": True}

class QuizBase(BaseModel):
    question: str
    options: List[str] = Field(..., min_items=2)
    correct_option_index: int

class QuizCreate(QuizBase):
    video_id: int

class QuizResponse(QuizBase):
    id: int
    video_id: int
    class Config:
        from_attributes = True

class QuizSubmissionCreate(BaseModel):
    selected_option_index: int

class QuizSubmissionResponse(BaseModel):
    id: int
    quiz_id: int
    selected_option_index: int
    is_correct: bool
    class Config:
        from_attributes = True

class VideoCreate(BaseModel):
    title: str
    url: str
    language_level: str

class VideoResponse(VideoCreate):
    id: int
    quizzes: List[QuizResponse] = []
    class Config:
        from_attributes = True