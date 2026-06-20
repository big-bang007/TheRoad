from pydantic import BaseModel, field_validator, Field
import re
from typing import Optional

class UserCreate(BaseModel):
    phone_number: str

    @field_validator('phone_number')
    def validate_phone(cls, v):
        # E.164 International Format: + followed by 1 to 14 digits
        # This strips spaces and ensures mathematical exactness
        cleaned = re.sub(r'\s|-|\(|\)', '', v)
        if not re.match(r"^\+[1-9]\d{1,14}$", cleaned):
            raise ValueError('Phone number must be in valid international format (e.g., +1234567890)')
        return cleaned

class UserResponse(BaseModel):
    id: int
    phone_number: str
    role: str
    
    model_config = {"from_attributes": True}

class UserProfileUpdate(BaseModel):
    name: str

class TokenUser(BaseModel):
    sub: str                    # The user's ID
    phone: str                  # The user's phone number
    role: str                   # 'student' or 'admin'
    name: Optional[str] = None  # Their profile name (Optional because new users don't have one yet)

    class Config:
        populate_by_name = True

class Token(BaseModel):
    access_token: str
    token_type: str