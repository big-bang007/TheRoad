from fastapi import Depends, HTTPException, status
from app.auth.dependencies import get_current_user
from app.models.user import User
import logging

# Configure logger
logger = logging.getLogger("admin_access")

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency that ensures the authenticated user is an admin.
    Raises 403 Forbidden if the user is just a student.
    """
    # 1. Check the role
    if current_user.role != "admin":
        # Security: Log the unauthorized attempt
        logger.warning(f"Unauthorized admin access attempt by user: {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action."
        )
    
    # 2. Log successful access
    # Uses Python's getattr to safely look for 'sub' or 'user_id' without crashing
        user_identifier = getattr(current_user, "sub", getattr(current_user, "user_id", "Unknown"))
        logger.info(f"Admin access granted to user: {user_identifier}")
    
    return current_user