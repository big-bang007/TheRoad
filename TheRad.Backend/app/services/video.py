from sqlalchemy.ext.asyncio import AsyncSession
from app.models.video import Video
from app.schemas.video import VideoCreate

class VideoService:
    @staticmethod
    async def create_lesson(db: AsyncSession, video_data: VideoCreate) -> Video:
        """Instantiates and saves a fresh curriculum video asset row."""
        new_video = Video(
            title=video_data.title,
            description=video_data.description,
            file_path=video_data.file_path
        )
        db.add(new_video)
        await db.commit()
        await db.refresh(new_video)
        return new_video