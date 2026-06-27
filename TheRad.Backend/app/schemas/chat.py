from pydantic import BaseModel
from datetime import datetime

class ChatMessageCreate(BaseModel):
    room_id: str
    sender_id: str
    sender_name: str
    content: str

class ChatMessageResponse(ChatMessageCreate):
    id: int
    timestamp: datetime

    model_config = {"from_attributes": True}