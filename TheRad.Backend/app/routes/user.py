from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserProfileUpdate

router = APIRouter(prefix="/api/v1/users", tags=["User Profile"])

@router.put("/profile", status_code=status.HTTP_200_OK)
async def update_profile(
    profile_data: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates the authenticated user's profile information.
    """
    # Update the name
    current_user.name = profile_data.name
    
    # Save the changes to the database
    await db.commit()
    await db.refresh(current_user)
    
    return {
        "message": "Profile updated successfully", 
        "name": current_user.name
    }