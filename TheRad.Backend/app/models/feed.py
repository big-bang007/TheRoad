from sqlalchemy import String, Integer, ForeignKey, Text, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from typing import List
from app.database.base import Base

class FeedPost(Base):
    __tablename__ = "feed_posts"
    __table_args__ = {'extend_existing': True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # 👇 FIX: Both are now nullable so a post can be text, a segment, or both.
    teaching_segment: Mapped[str] = mapped_column(Text, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=True) 
    file_url: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    comments: Mapped[List["FeedComment"]] = relationship("FeedComment", back_populates="post", cascade="all, delete-orphan")
    likes: Mapped[List["FeedLike"]] = relationship("FeedLike", back_populates="post", cascade="all, delete-orphan")
    user: Mapped["app.models.user.User"] = relationship("User")

class FeedComment(Base):
    __tablename__ = "feed_comments"
    __table_args__ = {'extend_existing': True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    post_id: Mapped[int] = mapped_column(Integer, ForeignKey("feed_posts.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    post: Mapped["FeedPost"] = relationship("FeedPost", back_populates="comments")
    user: Mapped["app.models.user.User"] = relationship("User")

class FeedLike(Base):
    __tablename__ = "feed_likes"
    __table_args__ = (
        UniqueConstraint('post_id', 'user_id', name='uq_post_user_like'),
        {'extend_existing': True}
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    post_id: Mapped[int] = mapped_column(Integer, ForeignKey("feed_posts.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    post: Mapped["FeedPost"] = relationship("FeedPost", back_populates="likes")


