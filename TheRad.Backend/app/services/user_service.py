import os
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User

async def register_user(db: AsyncSession, phone_number: str, email: str) -> User:
    # 1. Fetch the admin phone from .env
    admin_phone = os.getenv("ADMIN_PHONE_NUMBER")
    
    # 2. The Gatekeeper Logic
    # Assign 'admin' if it matches, otherwise default to 'student'
    role = "admin" if phone_number == admin_phone else "student"
    
    # 3. Create the user object
    new_user = User(
        phone_number=phone_number,
        email=email,
        role=role
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user