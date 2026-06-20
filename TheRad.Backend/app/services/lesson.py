import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from app.models.lesson import Lesson
from app.schemas.lesson import LessonSubmissionRequest, LessonGradeResponse, QuestionResult

class LessonEngine:
    
    @staticmethod
    async def get_all_lessons(db: AsyncSession):
        stmt = select(Lesson).order_by(Lesson.id.desc())
        result = await db.execute(stmt)
        lessons = result.scalars().all()

        formatted_lessons = []
        for lesson in lessons:
            formatted_lessons.append({
                "id": lesson.id,
                "title": lesson.title,
                "description": getattr(lesson, "description", ""),
                "transcript": getattr(lesson, "transcript", ""),
                "duration": "15m",
                "students": 0,
                "published": "Recently",
                "quizzes": lesson.lesson_quiz_data or [],
                "formFields": lesson.sentence_factory_data or [],
                "tests": lesson.final_test_data or [],
                "prepTasks": [] 
            })
        return formatted_lessons

    @staticmethod
    async def get_lesson_by_order(db: AsyncSession, order_number: int):
        """
        Queries the database to find a complete lesson matching the sequence order number.
        Throws a 404 error if it doesn't exist.
        """
        # 1. Build the database query to find the lesson by its order layout
        query = select(Lesson).where(Lesson.order_number == order_number)
        result = await db.execute(query)
        lesson = result.scalar_one_or_none()
        
        # 2. Safety Check: If the database returned nothing, halt and report 404
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND if 'status' in globals() else 404,
                detail=f"Lesson with sequence order {order_number} could not be found."
            )

    @staticmethod
    async def grade_submission(db: AsyncSession, lesson_id: int, submission: LessonSubmissionRequest) -> LessonGradeResponse:
        stmt = select(Lesson).where(Lesson.id == lesson_id)
        result = await db.execute(stmt)
        lesson = result.scalar_one_or_none()

        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found.")

        all_questions = []
        if lesson.lesson_quiz_data: all_questions.extend(lesson.lesson_quiz_data)
        if lesson.sentence_factory_data: all_questions.extend(lesson.sentence_factory_data)
        if lesson.final_test_data: all_questions.extend(lesson.final_test_data)

        total_questions = len(all_questions)
        correct_count = 0
        results = []

        for sub in submission.answers:
            if sub.question_id >= len(all_questions): continue

            question = all_questions[sub.question_id]
            # --- FIX: Force lowercase to match frontend ---
            q_type = str(question.get("type", "multiple_choice")).lower()
            is_correct = False
            feedback = "Incorrect"
            
            # --- DEBUGGING: Print this to your terminal ---
            print(f"DEBUG: Type={q_type}, UserAnswer={sub.answer}")

            if q_type == "multiple_choice":
                selected_idx = int(sub.answer) if str(sub.answer).isdigit() else -1
                options = question.get("options", [])
                correct_idx = next((i for i, opt in enumerate(options) if opt.get("isCorrect")), -1)
                
                is_correct = (selected_idx == correct_idx)
                feedback = "Correct!" if is_correct else "That wasn't the right choice."

            elif q_type == "short_answer":
                correct_ans = str(question.get("answer", "")).strip().lower()
                user_ans = str(sub.answer).strip().lower()
                is_correct = (user_ans == correct_ans)
                feedback = "Great job!" if is_correct else f"Incorrect. Answer was {correct_ans}."

            # Add other types here as needed...
            
            if is_correct:
                correct_count += 1
            
            results.append(QuestionResult(question_id=sub.question_id, is_correct=is_correct, feedback=feedback))

        return LessonGradeResponse(
            lesson_id=lesson_id,
            score_percentage=(correct_count / total_questions) * 100 if total_questions > 0 else 0,
            passed=(correct_count / total_questions) * 100 >= 50.0,
            results=results
        )