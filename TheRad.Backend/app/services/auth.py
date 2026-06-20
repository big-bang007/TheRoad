import os
import secrets
import string
import bcrypt
from datetime import datetime, timedelta, timezone
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.config.settings import settings
from app.models.user import User
from app.schemas.user import UserCreate

# 👇 1. IMPORT YOUR REAL SMS SERVICE 👇
from app.services.sms import send_otp_sms 

class AuthService:
    @staticmethod
    def verify_passcode(plain_passcode: str, hashed_passcode: str) -> bool:
        return bcrypt.checkpw(
            plain_passcode.encode('utf-8'), 
            hashed_passcode.encode('utf-8')
        )

    @staticmethod
    def get_password_hash(password: str) -> str:
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    @staticmethod
    def generate_secure_otp(length: int = 4) -> str:
        # Changed to 4 digits as Kavenegar templates usually prefer 4 or 5 digits
        return ''.join(secrets.choice(string.digits) for _ in range(length))

    @staticmethod
    def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=1440))
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    @staticmethod
    async def create_user_with_otp(db: AsyncSession, user_in: UserCreate) -> User:
        # 1. Check if number is already registered
        result = await db.execute(select(User).where(User.phone_number == user_in.phone_number))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Phone number already registered. Please log in.")

        # 2. Generate the permanent secure PIN
        raw_otp = AuthService.generate_secure_otp()
        
        # 3. --- THE ADMIN GATEKEEPER ---
        admin_phone = os.getenv("ADMIN_PHONE_NUMBER")
        user_role = "admin" if user_in.phone_number == admin_phone else "student"
        
        # 4. ASSIGN BOTH hashed_passcode AND otp_code
        new_user = User(
            phone_number=user_in.phone_number,
            hashed_passcode=AuthService.get_password_hash(raw_otp),
            otp_code=raw_otp,  
            role=user_role # Assigns 'admin' if it matches .env, otherwise 'student'
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        # 5. CALL THE REAL KAVENEGAR SMS FUNCTION
        print(f"DEBUG: Triggering real Kavenegar SMS for {new_user.phone_number}...")
        send_otp_sms(new_user.phone_number, raw_otp)
        
        return new_user

    @staticmethod
    async def resend_otp(db: AsyncSession, phone_number: str):
        """
        The central logic to regenerate a code and re-send the SMS.
        """
        # 1. Verify user exists
        result = await db.execute(select(User).where(User.phone_number == phone_number))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # 2. Generate new OTP 
        new_otp = AuthService.generate_secure_otp()
        
        # 3. Update the database record with the new code
        user.otp_code = new_otp
        user.hashed_passcode = AuthService.get_password_hash(new_otp) # Keep hash synced with OTP
        await db.commit()

        # 4. TRIGGER THE REAL KAVENEGAR SMS FUNCTION
        print(f"DEBUG: Resending Kavenegar SMS for {user.phone_number}...")
        send_otp_sms(user.phone_number, new_otp)
        
        return True        

    @staticmethod
    async def authenticate_user(db: AsyncSession, phone_number: str, passcode: str) -> User | None:
        # 1. Find the user
        result = await db.execute(select(User).where(User.phone_number == phone_number))
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"DEBUG LOGIN: User {phone_number} not found.")
            return None
            
        # 2. Clean the input (removes accidental spaces)
        clean_passcode = passcode.strip()
        
        # DEBUG PRINTS - Watch your terminal when you click Verify!
        print(f"DEBUG LOGIN: Trying to log in {phone_number}")
        print(f"DEBUG LOGIN: Code typed in React: '{clean_passcode}'")
        print(f"DEBUG LOGIN: Does DB have a hash saved? {bool(user.hashed_passcode)}")

        # 3. Verify using Bcrypt
        try:
            is_valid = AuthService.verify_passcode(clean_passcode, user.hashed_passcode)
            if not is_valid:
                print("DEBUG LOGIN: ❌ Bcrypt says the code is WRONG.")
                return None
        except Exception as e:
            print(f"DEBUG LOGIN: ❌ Bcrypt crashed! Error: {e}")
            return None
            
        print("DEBUG LOGIN: ✅ Code matches perfectly!")
        return user