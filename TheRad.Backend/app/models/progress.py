from sqlalchemy import ForeignKey, Integer, DateTime, Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from app.database.base import Base

class ProgressTrack(Base):
    __tablename__ = "progress_tracks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Link to the User
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # LINKED TO LESSONS: This replaces the old video_id
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    # Note: Make sure 'User' and 'Lesson' are imported or referenced correctly
    user: Mapped["User"] = relationship("User", back_populates="progress_records")
    lesson: Mapped["Lesson"] = relationship("Lesson") 

class VoiceMemo(Base):
    __tablename__ = "voice_memos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # UPDATE: Linking to lesson_id here too
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    
    file_path: Mapped[str] = mapped_column(String, nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))