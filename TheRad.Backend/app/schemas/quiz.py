from pydantic import BaseModel, Field, ConfigDict
from typing import List, Literal, Union, Dict, Any

# --- 1. THE 4 QUESTION TYPES ---

class MultipleChoiceQuestion(BaseModel):
    type: Literal["multiple_choice"]
    question_text: str
    options: List[str] = Field(..., min_length=2, description="At least 2 options required")
    correct_answer: str

class ShortAnswerQuestion(BaseModel):
    type: Literal["short_answer"]
    question_text: str
    accepted_answers: List[str] = Field(..., min_length=1)

class DraggingWordsQuestion(BaseModel):
    type: Literal["dragging_words"]
    sentence_template: str = Field(..., description="Sentence with [brackets] for blanks")
    distractors: List[str] = Field(default_factory=list, description="Extra incorrect words")

class ConnectingWordsQuestion(BaseModel):
    type: Literal["connecting_words"]
    instruction: str
    pairs: List[Dict[str, str]] = Field(..., description="List of left/right matching pairs")

# This tells FastAPI to dynamically figure out which question schema to use based on the 'type' field!
QuestionItem = Union[
    MultipleChoiceQuestion, 
    ShortAnswerQuestion, 
    DraggingWordsQuestion, 
    ConnectingWordsQuestion
]

# --- 2. THE SECTION WAPPERS ---

class LessonSectionVideo(BaseModel):
    video_url: str
    script: str

class LessonSectionVocab(BaseModel):
    description: str
    words: List[str]

class QuizSection(BaseModel):
    title: str
    questions: List[QuestionItem] = Field(default_factory=list)

# --- 3. THE MASTER LESSON PAYLOAD ---

class LessonCreate(BaseModel):
    title: str
    order_number: int
    preparation_task: str
    video_section: LessonSectionVideo
    description_section: LessonSectionVocab
    lesson_quiz: QuizSection
    sentence_factory: QuizSection 
    final_test: QuizSection

class LessonResponse(BaseModel):
    id: int
    title: str
    order_number: int
    preparation_task: str
    
    # We map the DB column names to the Schema names here
    video_section: Any = Field(..., alias="video_data")
    description_section: Any = Field(..., alias="description_data")
    lesson_quiz: Any = Field(..., alias="lesson_quiz_data")
    sentence_factory: Any = Field(..., alias="sentence_factory_data")
    final_test: Any = Field(..., alias="final_test_data")

    # This is the magic part! 
    # It tells Pydantic: "When you see the DB model, look for these aliases."
    model_config = ConfigDict(
        from_attributes=True, 
        populate_by_name=True
    )

class Config:
        from_attributes = True