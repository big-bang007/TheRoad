import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.lesson import Lesson

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
                # 👇 Fixed to fetch from DB instead of returning empty array
                "prepTasks": lesson.preparation_task or [] 
            })
        return formatted_lessons

    @staticmethod
    async def get_lesson_by_order(db: AsyncSession, order_number: int):
        """
        Queries the database to find a complete lesson matching the sequence order number.
        Throws a 404 error if it doesn't exist.
        """
        query = select(Lesson).where(Lesson.order_number == order_number)
        result = await db.execute(query)
        lesson = result.scalar_one_or_none()
        
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND if 'status' in globals() else 404,
                detail=f"Lesson with sequence order {order_number} could not be found."
            )
        return lesson

    @staticmethod
    async def validate_prep_tasks(db: AsyncSession, lesson_id: int, user_answers: dict):
        """Grades preparation tasks. Fails instantly if ANY answer is wrong."""
        lesson = await db.get(Lesson, lesson_id)
        if not lesson or not lesson.preparation_task:
            raise HTTPException(status_code=404, detail="Lesson or tasks not found")

        wrong_answers = []
        
        # Iterate through the JSON array saved in the database
        for task in lesson.preparation_task:
            question_text = task.get("question")
            
            # Find the exact option where isCorrect == True
            correct_option = next(
                (opt["text"] for opt in task.get("options", []) if opt.get("isCorrect")), 
                None
            )

            # Compare against the user's submitted dictionary
            user_ans = user_answers.get(question_text)

            if user_ans != correct_option:
                wrong_answers.append({
                    "question": question_text,
                    "your_answer": str(user_ans) if user_ans else "None",
                    "explanation": task.get("explanation", "Incorrect. Please review the lesson introduction.")
                })

        # If there are any mistakes, they fail the prep task barrier
        if wrong_answers:
            return {"passed": False, "errors": wrong_answers}
            
        return {"passed": True}


    @staticmethod
    async def grade_exam(db: AsyncSession, lesson_id: int, user_answers: dict, exam_type: str = "quiz"):
        """Grades quizzes and tests. Requires 80% to pass and returns a hint guide if failed."""
        lesson = await db.get(Lesson, lesson_id)
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        # Determine if we are grading the mid-lesson quiz or the final test
        exam_data = lesson.lesson_quiz_data if exam_type == "quiz" else lesson.final_test_data
        
        if not exam_data:
            return {"passed": True, "score": 100}

        total_questions = len(exam_data)
        correct_count = 0
        wrong_answers = []

        for q in exam_data:
            question_text = q.get("question")
            correct_option = next(
                (opt["text"] for opt in q.get("options", []) if opt.get("isCorrect")), 
                None
            )

            user_ans = user_answers.get(question_text)

            if user_ans == correct_option:
                correct_count += 1
            else:
                wrong_answers.append({
                    "question": question_text,
                    "explanation": q.get("explanation", "Review the material for this topic.")
                })

        # Calculate Score
        score = (correct_count / total_questions) * 100 if total_questions > 0 else 100

        # Pass/Fail Threshold (80%)
        if score < 80:
            return {
                "passed": False,
                "score": round(score, 2),
                "hints": wrong_answers # 👈 This is your Hint Guide Sheet!
            }

        return {"passed": True, "score": round(score, 2)}