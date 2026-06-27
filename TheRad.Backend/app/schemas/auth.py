from pydantic import BaseModel, EmailStr

class ResendCodeRequest(BaseModel):
    email: EmailStr

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str