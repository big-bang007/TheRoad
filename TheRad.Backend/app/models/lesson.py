from sqlalchemy import String, Integer, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from typing import List, Dict, Any
from app.database.base import Base
from sqlalchemy import JSON

class Lesson(Base):
    __tablename__ = "lessons"
    __table_args__ = {'extend_existing': True}

    # --- 1. Core Metadata ---
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    order_number: Mapped[int] = mapped_column(Integer, unique=True, nullable=False) 
    
    # 👇 ADDED: Plain text description field to perfectly match your React frontend form payload!
    #description: Mapped[str] = mapped_column(Text, nullable=True)
    #transcript: Mapped[str] = mapped_column(Text, nullable=True)

    # --- 2. Preparation Task ---
    preparation_task: Mapped[str] = mapped_column(JSON, nullable=True)
    
    # --- 3 & 4. Content Sections (Stored as JSON for flexibility) ---
    # Example: {"video_url": "url", "script": "transcript..."}
    video_data: Mapped[dict] = mapped_column(JSON, nullable=True) 
    
    # Example: {"description": "grammar rules", "words": ["apple", "tree"]}
    description_data: Mapped[dict] = mapped_column(JSON, nullable=True) 
    
    # --- 5, 6, & 7. Interactive Quizzes (Stored as JSON Arrays) ---
    # These lists will store the dictionaries validated by your Pydantic schemas!
    lesson_quiz_data: Mapped[list] = mapped_column(JSON, nullable=True)      
    sentence_factory_data: Mapped[list] = mapped_column(JSON, nullable=True) 
    final_test_data: Mapped[list] = mapped_column(JSON, nullable=True)       

    # ❌ OLD RELATIONSHIPS REMOVED: 
    # videos: Mapped[List["Video"]] = relationship(...)
    # quizzes: Mapped[List["QuizQuestion"]] = relationship(...)
    # We removed these because PostgreSQL JSON columns now handle this data much more efficiently for your specific MVP!