from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User # Assumes you have your User model defined here

async def get_user_by_phone(db: AsyncSession, phone_number: str):
    """
    Queries the database to find a user by their phone number.
    Returns the user object if found, or None if they are not registered.
    """
    result = await db.execute(select(User).where(User.phone_number == phone_number))
    return result.scalars().first()