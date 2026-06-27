from pydantic import BaseModel
from typing import List, Optional, Any, Dict  # 1. Added Any

# ==========================================
# 📤 OUTGOING RESPONSES (To Frontend)
# ==========================================

class LessonVideoResponse(BaseModel):
    id: int
    title: str
    url: str
    model_config = {"from_attributes": True}

class QuizQuestionResponse(BaseModel):
    id: int
    question_type: str
    question_text: str
    options: Optional[List[str]] = None
    model_config = {"from_attributes": True}

class LessonResponse(BaseModel):
    id: int
    title: str
    order_number: int
    videos: List[LessonVideoResponse] = []
    quizzes: List[QuizQuestionResponse] = []
    model_config = {"from_attributes": True}

# ==========================================
# 📥 INCOMING REQUESTS (From Frontend)
# ==========================================

class AnswerSubmission(BaseModel):
    question_id: int
    answer: Any  # 2. Changed from 'str' to 'Any' to accept Objects/Arrays

class LessonSubmissionRequest(BaseModel):
    answers: List[AnswerSubmission]

# ==========================================
# 🧠 ENGINE OUTPUTS
# ==========================================

class QuestionResult(BaseModel):
    question_id: int
    is_correct: bool
    feedback: str

class LessonGradeResponse(BaseModel):
    lesson_id: int
    score_percentage: float
    passed: bool
    results: List[QuestionResult]

class StudentSubmission(BaseModel):
    answers: Dict[str, Any]

# Response layout for Prep Tasks (Blocker)
class PrepTaskResponse(BaseModel):
    passed: bool
    errors: Optional[List[Dict[str, str]]] = None

# Response layout for Quizzes/Tests (Grader & Hint Guide)
class GradeResponse(BaseModel):
    passed: bool
    score: float
    hints: Optional[List[Dict[str, str]]] = None