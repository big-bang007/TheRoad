from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional, TYPE_CHECKING
from app.database.base import Base

class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    phone_number: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_passcode: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, default="student")
    otp_code: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    name: Mapped[str] = mapped_column(String, nullable=True)


    # --- Missing Relationships Added Back ---
    
    # Update this specific relationship:
    progress_records: Mapped[List["app.models.progress.ProgressTrack"]] = relationship(
        "app.models.progress.ProgressTrack", 
        back_populates="user"
    )
    
   # Links to the QuizSubmission model we verified earlier
submissions: Mapped[List["app.models.quiz.QuizSubmission"]] = relationship(
    "app.models.quiz.QuizSubmission", 
    back_populates="user"
)