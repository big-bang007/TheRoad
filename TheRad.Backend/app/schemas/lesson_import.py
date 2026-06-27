from pydantic import BaseModel
from typing import List, Optional

# --- 1. Basic Structures ---
class ExcelQuizOption(BaseModel):
    text: str
    isCorrect: bool

# --- 2. Dynamic Question Schema ---
class ExcelQuizItem(BaseModel):
    """
    Handles Multiple Choice, True/False, and Fill-in-the-Blank.
    """
    type: str  # e.g., "MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_IN_BLANK"
    question: str
    options: Optional[List[ExcelQuizOption]] = [] # Used for MC or T/F
    answer: Optional[str] = None # Used for Fill-in-the-blank
    explanation: Optional[str] = ""
# --- 3. Sentence Factory Schema ---
class ExcelSentenceFactoryItem(BaseModel):
    hint: str
    correct_sentence: str
    distractors: List[str]
    explanation: Optional[str] = ""
# --- 4. Main Payload Schema ---
class ExcelLessonImportResult(BaseModel):
    """
    This structure matches the keys your parser service returns
    and your Frontend needs to pre-fill the form.
    """
    preparation_task: List[ExcelQuizItem]
    lesson_quiz_data: List[ExcelQuizItem]
    final_test_data: List[ExcelQuizItem]
    sentence_factory_data: List[ExcelSentenceFactoryItem]