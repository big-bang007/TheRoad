from sqlalchemy import String, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    __table_args__ = {'extend_existing': True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    
    # Types: "multiple_choice", "short_answer", or "voice_memo"
    question_type: Mapped[str] = mapped_column(String, nullable=False) 
    question_text: Mapped[str] = mapped_column(String, nullable=False)
    
    # Only used if type is "multiple_choice", otherwise null
    options: Mapped[list | None] = mapped_column(JSON, nullable=True) 
    
    # The exact text to match for short answers, or the index string for MCQs.
    # Null for voice memos since those require manual/AI review.
    correct_answer: Mapped[str | None] = mapped_column(String, nullable=True) 

    # Short class name used here!
    #lesson: Mapped["Lesson"] = relationship("Lesson", back_populates="quizzes")