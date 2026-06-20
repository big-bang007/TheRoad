import os
import json
import shutil
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status, Query, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete
from jose import jwt, JWTError

from app.database.connection import get_db
from app.services.chat import manager, save_chat_message, get_chat_history_from_db
from app.schemas.chat import ChatMessageCreate
from app.models.chat import ChatMessage  # Added for deletion
from app.config.settings import settings 

router = APIRouter(tags=["Chat"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ==========================================
# 🌉 THE BRIDGE: REST to WEBSOCKET (MEDIA & SEGMENTS)
# ==========================================
@router.post("/{room_id}/broadcast")
async def broadcast_from_rest(
    room_id: str, 
    sender_id: str = Form(...),
    sender_name: str = Form(...),
    content: str = Form(""),
    type: str = Form("segment"),
    file: UploadFile = File(None),
    db: AsyncSession = Depends(get_db)
):
    """Allows web pages to post text AND media directly into the live WebSocket feed!"""
    try:
        file_url = ""
        if file and file.filename:
            safe_filename = file.filename.replace(" ", "_")
            file_path = os.path.join(UPLOAD_DIR, safe_filename)
            with open(file_path, "wb+") as f:
                shutil.copyfileobj(file.file, f)
            file_url = f"/uploads/{safe_filename}"

        # Package the content
        final_content = content
        if file_url:
            final_content += f" [MEDIA:{file_url}]"
            
        timestamp_str = datetime.utcnow().isoformat() + "Z"

        # 1. Save to Database
        msg_create = ChatMessageCreate(
            room_id=room_id,
            sender_id=sender_id,
            sender_name=sender_name,
            content=final_content.strip()
        )
        await save_chat_message(db, msg_create)

        # 2. THE MEGAPHONE FIX: Push directly to all live websocket clients!
        message_data = {
            "sender_id": sender_id,
            "sender_name": sender_name,
            "content": final_content.strip(),
            "type": type,
            "timestamp": timestamp_str,
            "system": False
        }
        await manager.broadcast(json.dumps(message_data), room_id)

        return {"status": "success", "message": "Broadcast pushed live!"}
    
    except Exception as e:
        print(f"Broadcast Error: {e}")
        return {"status": "error", "detail": str(e)}

# ==========================================
# 🗑️ ADMIN: WIPE ENTIRE HISTORY
# ==========================================
@router.delete("/{room_id}/history")
async def clear_chat_history(room_id: str, db: AsyncSession = Depends(get_db)):
    """Deletes all messages in a specific room."""
    try:
        await db.execute(delete(ChatMessage).where(ChatMessage.room_id == room_id))
        await db.commit()
        
        # Push wipe command to all screens
        await manager.broadcast(json.dumps({
            "system": True, 
            "content": "Chat history has been cleared by Admin.", 
            "type": "clear_history"
        }), room_id)
        
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

# ==========================================
# 🗑️ USERS/ADMIN: DELETE INDIVIDUAL MESSAGE
# ==========================================
@router.delete("/{room_id}/message")
async def delete_single_message(room_id: str, timestamp: str, db: AsyncSession = Depends(get_db)):
    """Deletes a specific message based on its timestamp identifier."""
    try:
        # Delete from DB using timestamp to isolate the exact message
        await db.execute(delete(ChatMessage).where(
            ChatMessage.room_id == room_id,
            ChatMessage.timestamp == timestamp
        ))
        await db.commit()
        
        # Instruct all frontends to hide this specific bubble
        await manager.broadcast(json.dumps({
            "type": "delete_message",
            "timestamp": timestamp
        }), room_id)
        
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

# ==========================================
# 🔌 STANDARD WEBSOCKET ROUTE
# ==========================================
@router.websocket("/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, token: str = Query(None), db: AsyncSession = Depends(get_db)):
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        user_name = payload.get("name", "User")
    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 🟢 THE FIX: We answer the phone
    await websocket.accept()

    await manager.connect(websocket, room_id)
    safe_name = user_name if user_name else f"User {str(user_id)[-4:]}"
    
    try:
        await manager.broadcast(json.dumps({
            "system": True, 
            "content": f"{safe_name} joined the sanctuary."
        }), room_id)
        
        while True:
            data = await websocket.receive_text()
            payload_data = json.loads(data)
            
            timestamp_str = datetime.utcnow().isoformat() + "Z"
            
            msg_create = ChatMessageCreate(
                room_id=room_id,
                sender_id=str(user_id),
                sender_name=safe_name, 
                content=payload_data.get("content")
            )
            await save_chat_message(db, msg_create)
            
            broadcast_payload = json.dumps({
                "sender_id": str(user_id),
                "sender_name": safe_name,
                "content": payload_data.get("content"),
                "type": payload_data.get("type", "chat"),       
                "timestamp": timestamp_str       
            })
            await manager.broadcast(broadcast_payload, room_id)
            
    # 🟢 THE MISSING PIECE: The except block for when a user leaves!
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
        await manager.broadcast(json.dumps({
            "system": True, 
            "content": f"{safe_name} left the sanctuary."
        }), room_id)

# ==========================================
# 📜 FETCH HISTORY ROUTE
# ==========================================
@router.get("/{room_id}/history")
async def get_room_history(room_id: str, db: AsyncSession = Depends(get_db)):
    """Fetches past messages when a user joins the room."""
    history = await get_chat_history_from_db(db, room_id, limit=50)
    return history