import json
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.database.connection import get_db
from app.models.lesson import Lesson

router = APIRouter(tags=["Admin Panel"])

# 🛡️ THE FIX: Changed path to "/lessons" to match your frontend POST request perfectly
@router.post("/lessons", status_code=status.HTTP_201_CREATED)
async def create_lesson(
    title: str = Form(...),
    order_number: str = Form("1"),
    description: str = Form(""),
    transcript: str = Form(""),
    video: Optional[UploadFile] = File(None),
    prepTasks: str = Form("[]"),
    quizzes: str = Form("[]"),
    formFields: str = Form("[]"),
    tests: str = Form("[]"),
    db: AsyncSession = Depends(get_db)
):
    try:
        # 1. Safely decode input JSON arrays
        parsed_prep = json.loads(prepTasks) if prepTasks else []
        parsed_quizzes = json.loads(quizzes) if quizzes else []
        parsed_fields = json.loads(formFields) if formFields else []
        parsed_tests = json.loads(tests) if tests else []

        video_url = f"/uploads/{video.filename}" if video else ""
        
        try:
            clean_order = int(order_number)
        except ValueError:
            clean_order = 1

        # 2. Package data inside database JSON columns (video_data & description_data)
        # to ensure PostgreSQL doesn't look for non-existent flat text columns
        new_lesson = Lesson(
            title=title,
            order_number=clean_order,
            preparation_task=parsed_prep,
            
            # Nest transcript into the video_data column mapping
            video_data={
                "video_url": video_url,
                "transcript": transcript
            },
            
            # Nest description into the description_data column mapping
            description_data={
                "description": description
            },
            
            lesson_quiz_data=parsed_quizzes,
            sentence_factory_data=parsed_fields,
            final_test_data=parsed_tests
        )
        
        db.add(new_lesson)
        await db.commit()
        await db.refresh(new_lesson)
        
        print(f"🎉 SUCCESS! Stored Plural Lesson Build Layout: '{title}' (ID: {new_lesson.id})")
        return {"status": "success", "message": "Lesson successfully built!", "id": new_lesson.id}
    
    except Exception as e:
        await db.rollback()
        print(f"❌ DATABASE ERROR: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))