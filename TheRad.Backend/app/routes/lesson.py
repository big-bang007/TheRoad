import os
import json
import shutil
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm.attributes import flag_modified

from app.models.lesson import Lesson
from app.database.connection import get_db
# NOTE: Ensure StudentSubmission, PrepTaskResponse, and GradeResponse are added to your schemas!
from app.schemas.lesson import StudentSubmission, PrepTaskResponse, GradeResponse 
from app.services.lesson import LessonEngine

router = APIRouter(tags=["Lessons Engine"])

# 📁 DEFINE AND CREATE STATIC FILES STORAGE DIRECTORY
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ==========================================================
# 1. ADMIN ROUTES (Creating, Listing, Updating, Deleting)
# ==========================================================

@router.get("/lessons")
async def get_lessons(db: AsyncSession = Depends(get_db)):
    """Fetches lessons and perfectly flattens the JSON for the React Frontend."""
    try:
        stmt = select(Lesson).order_by(Lesson.order_number)
        result = await db.execute(stmt)
        db_lessons = result.scalars().all()
        
        formatted_lessons = []
        for lesson in db_lessons:
            # Safely unpack the nested JSON strings/dicts from the database
            v_data = lesson.video_data if isinstance(lesson.video_data, dict) else {}
            if isinstance(lesson.video_data, str):
                try: v_data = json.loads(lesson.video_data)
                except: v_data = {}
                
            d_data = lesson.description_data if isinstance(lesson.description_data, dict) else {}
            if isinstance(lesson.description_data, str):
                try: d_data = json.loads(lesson.description_data)
                except: d_data = {}

            formatted_lessons.append({
                "id": lesson.id,
                "title": lesson.title,
                "order_number": lesson.order_number,
                "description": d_data.get("description", ""),
                "video_url": v_data.get("video_url", ""),
                "transcript": v_data.get("transcript", ""),
                "prep_tasks": lesson.preparation_task or [],
                "quizzes": lesson.lesson_quiz_data or [],
                "form_fields": lesson.sentence_factory_data or [],
                "tests": lesson.final_test_data or []
            })
            
        print(f"📡 Delivered {len(formatted_lessons)} flattened lessons to frontend!")
        return formatted_lessons

    except Exception as e:
        print(f"❌ Error fetching lessons: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not fetch lessons from database")


@router.post("/lessons", status_code=status.HTTP_201_CREATED)
async def create_lesson(
    title: str = Form(...),
    order_number: Optional[int] = Form(1),  
    description: str = Form(""),
    transcript: str = Form(""),
    video: Optional[UploadFile] = File(None),
    prepTasks: str = Form("[]"),
    quizzes: str = Form("[]"),
    formFields: str = Form("[]"),
    tests: str = Form("[]"),
    db: AsyncSession = Depends(get_db)
):
    """Catches the POST request, safely persists files to disk, and writes records."""
    try:
        parsed_prep = json.loads(prepTasks)
        parsed_quizzes = json.loads(quizzes)
        parsed_fields = json.loads(formFields)
        parsed_tests = json.loads(tests)

        # 💾 SAVE FILE TO LOCAL DISK SYSTEM
        video_url = ""
        if video and video.filename:
            safe_filename = video.filename.replace(" ", "_")
            file_path = os.path.join(UPLOAD_DIR, safe_filename)
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(video.file, buffer)
            
            video_url = f"/uploads/{safe_filename}"
        
        new_lesson = Lesson(
            title=title,
            order_number=int(order_number) if order_number else 1,
            preparation_task=parsed_prep,
            video_data={
                "video_url": video_url,
                "transcript": transcript
            },
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
        
        print(f"🎉 SUCCESS! Saved Lesson and Video asset to Storage: '{title}' (ID: {new_lesson.id})")
        return {"message": "Lesson created successfully", "id": new_lesson.id, "title": title}
    
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="Failed to parse JSON arrays.")
    except Exception as e:
        await db.rollback()
        print(f"❌ DATABASE ERROR: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/lessons/{lesson_id}")
async def delete_lesson(lesson_id: int, db: AsyncSession = Depends(get_db)):
    """Deletes a lesson from the database."""
    stmt = select(Lesson).where(Lesson.id == lesson_id)
    result = await db.execute(stmt)
    lesson = result.scalar_one_or_none()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found.")
        
    await db.delete(lesson)
    await db.commit()
    
    print(f"🗑️ SUCCESS! Deleted Lesson ID: {lesson_id}")
    return {"message": "Lesson deleted successfully"}

@router.put("/lessons/{lesson_id}")
async def update_lesson(
    lesson_id: int,
    title: str = Form(...),
    order_number: Optional[int] = Form(1),
    description: str = Form(""),
    transcript: str = Form(""),
    video: Optional[UploadFile] = File(None),
    prepTasks: str = Form("[]"),
    quizzes: str = Form("[]"),
    formFields: str = Form("[]"),
    tests: str = Form("[]"),
    db: AsyncSession = Depends(get_db)
):
    """Updates an existing lesson and manages media states securely."""
    stmt = select(Lesson).where(Lesson.id == lesson_id)
    result = await db.execute(stmt)
    lesson = result.scalar_one_or_none()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found.")

    try:
        parsed_prep = json.loads(prepTasks)
        parsed_quizzes = json.loads(quizzes)
        parsed_fields = json.loads(formFields)
        parsed_tests = json.loads(tests)

        current_video_data = lesson.video_data
        if isinstance(current_video_data, str):
            try:
                current_video_data = json.loads(current_video_data)
            except Exception:
                current_video_data = {}
        if not isinstance(current_video_data, dict):
            current_video_data = {}

        if video and video.filename:
            safe_filename = video.filename.replace(" ", "_")
            file_path = os.path.join(UPLOAD_DIR, safe_filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(video.file, buffer)
            updated_video_url = f"/uploads/{safe_filename}"
        else:
            updated_video_url = current_video_data.get("video_url", "")

        lesson.title = title
        lesson.order_number = int(order_number) if order_number else lesson.order_number
        lesson.preparation_task = parsed_prep
        
        lesson.video_data = {
            "video_url": updated_video_url,
            "transcript": transcript
        }
        lesson.description_data = {
            "description": description
        }
        
        lesson.lesson_quiz_data = parsed_quizzes
        lesson.sentence_factory_data = parsed_fields
        lesson.final_test_data = parsed_tests

        flag_modified(lesson, "video_data")
        flag_modified(lesson, "description_data")
        flag_modified(lesson, "preparation_task")
        flag_modified(lesson, "lesson_quiz_data")
        flag_modified(lesson, "sentence_factory_data")
        flag_modified(lesson, "final_test_data")

        await db.commit()
        await db.refresh(lesson)
        
        print(f"📝 SUCCESS! Updated Lesson: '{title}' (ID: {lesson_id})")
        return {"message": "Lesson updated successfully", "id": lesson.id}

    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="Failed to parse JSON arrays.")
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# ==========================================================
# 2. STUDENT ROUTES (Fetching & Grading)
# ==========================================================

@router.get("/lessons/{order_number}")
async def fetch_lesson(order_number: int, db: AsyncSession = Depends(get_db)):
    """Fetches a complete lesson by its chronological order sequence."""
    return await LessonEngine.get_lesson_by_order(db, order_number)

# 👇 NEW DYNAMIC GRADING ROUTES 

@router.post("/lessons/{lesson_id}/submit-prep", response_model=PrepTaskResponse)
async def submit_preparation_task(
    lesson_id: int, 
    submission: StudentSubmission, 
    db: AsyncSession = Depends(get_db)
):
    """Checks prep tasks to unlock the rest of the lesson."""
    return await LessonEngine.validate_prep_tasks(db, lesson_id, submission.answers)

@router.post("/lessons/{lesson_id}/submit-quiz", response_model=GradeResponse)
async def submit_lesson_quiz(
    lesson_id: int, 
    submission: StudentSubmission, 
    db: AsyncSession = Depends(get_db)
):
    """Grades the standard lesson quiz."""
    return await LessonEngine.grade_exam(db, lesson_id, submission.answers, exam_type="quiz")

@router.post("/lessons/{lesson_id}/submit-test", response_model=GradeResponse)
async def submit_final_test(
    lesson_id: int, 
    submission: StudentSubmission, 
    db: AsyncSession = Depends(get_db)
):
    """Grades the final test before unlocking the next lesson."""
    return await LessonEngine.grade_exam(db, lesson_id, submission.answers, exam_type="test")