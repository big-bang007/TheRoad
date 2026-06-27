from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
import sys
from app.database.connection import get_db
from app.models.user import User
from app.schemas.user import UserCreate, Token, TokenUser
from app.services.auth import AuthService
from app.services.user import get_user_by_phone
from app.auth.dependencies import get_current_user, get_current_admin

router = APIRouter(prefix="/auth", tags=["Authentication"])

class PhoneRequest(BaseModel):
    phone_number: str

class VerifyRequest(BaseModel):
    phone_number: str
    code: str

class ProfileUpdateRequest(BaseModel):
    name: str

@router.put("/profile", status_code=status.HTTP_200_OK)
async def update_user_profile(
    data: ProfileUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: TokenUser = Depends(get_current_user)
):
    """Updates the user's name after registration."""
    # Debug: Print the user object to see what it actually contains
    print(f"DEBUG: Current User Object: {current_user}")
    
    # 🛡️ THE FIX: Safely extract the ID using both 'id' and 'sub'
    user_id = getattr(current_user, 'id', getattr(current_user, 'sub', None))
    
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID missing from token")

    # Update the user's name in the database
    stmt = update(User).where(User.id == int(user_id)).values(name=data.name.strip())
    await db.execute(stmt)
    await db.commit()
    
    return {"message": "Profile updated successfully", "name": data.name.strip()}


@router.get("/profile", status_code=status.HTTP_200_OK)
async def get_profile(
    db: AsyncSession = Depends(get_db),
    current_user: TokenUser = Depends(get_current_user)
):
    """Fetches the user profile data to populate the dashboard."""
    
    # Safely extract the ID
    user_id = getattr(current_user, 'id', getattr(current_user, 'sub', None))
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token structure")

    # Query the database
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Use getattr to safely pull the phone number and name so it never crashes
    return {
        "id": user.id,
        "name": getattr(user, 'name', 'Cozy Learner'),
        "phone": getattr(user, 'phone_number', getattr(user, 'phone', '')), 
        "streak": getattr(user, 'streak', 0), 
        "cozyScore": getattr(user, 'cozyScore', 0),
        "hyggeLevel": getattr(user, 'hyggeLevel', 'Newcomer')
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(data: PhoneRequest, db: AsyncSession = Depends(get_db)):
    user_in = UserCreate(phone_number=data.phone_number)
    try:
        await AuthService.create_user_with_otp(db, user_in)
        return {"message": "User registered successfully"}
    except Exception as e:
        # 👇 We added sys.stderr and flush=True to bypass Linux buffering!
        print(f"\n🚨 🔥 SIGNUP CRASH FAILED REASON: {repr(e)} 🔥 \n", file=sys.stderr, flush=True)
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/request-otp")
async def request_otp(data: PhoneRequest, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_phone(db, data.phone_number) 
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This number is not registered. Please sign up first!"
        )
    return {"message": "Ready for passcode!"}


@router.post("/verify-otp", response_model=Token)
async def verify_otp(data: VerifyRequest, db: AsyncSession = Depends(get_db)):
    user = await AuthService.authenticate_user(db, data.phone_number, data.code)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect passcode. Please try again."
        )
    
    # The JWT Payload now contains the user's name
    access_token = AuthService.create_access_token(
        data={
            "sub": str(user.id), 
            "phone": user.phone_number, 
            "role": user.role,
            "name": getattr(user, "name", None)  
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/resend-code")
async def resend_code(data: PhoneRequest, db: AsyncSession = Depends(get_db)):
    try:
        await AuthService.resend_otp(db, data.phone_number)
        return {"message": "OTP has been resent successfully."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to send SMS: {str(e)}")

@router.get("/users", status_code=status.HTTP_200_OK)
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    admin_user: TokenUser = Depends(get_current_admin)  # 🛡️ Only admins can access this!
):
    """Fetches a list of all registered users for the admin dashboard."""
    result = await db.execute(select(User).order_by(User.id.desc()))
    users = result.scalars().all()
    
    # Format the data securely
    return [
        {
            "id": str(u.id),
            "name": getattr(u, "name", "Cozy Learner"),
            "phone": getattr(u, "phone_number", getattr(u, "phone", "Unknown")),
            "role": getattr(u, "role", "student"),
            "streak": getattr(u, "streak", 0),
            "cozyScore": getattr(u, "cozyScore", 0)
        }
        for u in users
    ]