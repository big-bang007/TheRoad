from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Dict, List

from app.models.chat import ChatMessage
from app.schemas.chat import ChatMessageCreate


class ConnectionManager:
    def __init__(self):
        # Stores active websocket connections per room
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        # We ALREADY accepted the connection in routes/chat.py, 
        # so we just add the socket to the list here.
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    # 👇 Notice how this is perfectly indented inside the class now!
    async def broadcast(self, message: str, room_id: str):
        if room_id in self.active_connections:
            dead_connections = []
            
            # 1. Try to send the message to everyone in the room
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_text(message)
                except Exception:
                    # If React or the browser suddenly killed the connection, 
                    # catch the error and mark this connection as dead!
                    dead_connections.append(connection)
            
            # 2. Clean up the dead connections so we don't message them again
            for dead in dead_connections:
                if dead in self.active_connections[room_id]:
                    self.active_connections[room_id].remove(dead)


# 👇 Creates the active instance for the router to import (Zero indentation)
manager = ConnectionManager()


# --- DATABASE FUNCTIONS (Zero indentation) ---

async def save_chat_message(db: AsyncSession, msg_data: ChatMessageCreate) -> ChatMessage:
    """Persists a broadcasted message into the PostgreSQL history log."""
    new_msg = ChatMessage(
        room_id=msg_data.room_id,
        sender_id=msg_data.sender_id,
        sender_name=msg_data.sender_name,
        content=msg_data.content
    )
    db.add(new_msg)
    await db.commit()
    await db.refresh(new_msg)
    return new_msg


async def get_chat_history_from_db(db: AsyncSession, room_id: str, limit: int = 50):
    """Retrieves the last N messages from PostgreSQL."""
    stmt = select(ChatMessage).where(ChatMessage.room_id == room_id).order_by(desc(ChatMessage.timestamp)).limit(limit)
    result = await db.execute(stmt)
    # Order oldest to newest for the frontend chat view
    return list(reversed(result.scalars().all()))