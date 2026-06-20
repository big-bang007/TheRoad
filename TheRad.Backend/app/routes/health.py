from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.database.connection import get_db

router = APIRouter(tags=["System Health"])

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Verifies backend application status along with downstream database connectivity."""
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": f"error: {str(e)}"}, 500