from sqlalchemy import String, Integer, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, timezone
from app.database.base import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    __table_args__ = {'extend_existing': True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    room_id: Mapped[str] = mapped_column(String, index=True)
    sender_id: Mapped[str] = mapped_column(String, index=True)
    sender_name: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)