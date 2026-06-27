import io
import pandas as pd
from fastapi import UploadFile, HTTPException
from typing import Dict, Any, List

async def parse_admin_lesson_excel(file: UploadFile) -> Dict[str, Any]:
    """
    Parses a unified admin excel workbook.
    Dynamically maps MULTIPLE_CHOICE, TRUE_FALSE, FILL_IN_BLANK, SHORT_ANSWER, 
    and SENTENCE_FACTORY into distinct structured JSON arrays for the frontend state.
    """
    if not file.filename.endswith(('.xls', '.xlsx')):
        raise HTTPException(status_code=400, detail="Uploaded file format must be Excel (.xlsx).")
        
    contents = await file.read()
    try:
        excel_file = pd.ExcelFile(io.BytesIO(contents))
        
        # State Arrays
        preparation_task: List[Dict[str, Any]] = []
        lesson_quiz_data: List[Dict[str, Any]] = []
        final_test_data: List[Dict[str, Any]] = []
        sentence_factory_data: List[Dict[str, Any]] = []

        # Read the primary sheet (Default to first sheet if name varies)
        sheet_name = "Master Content" if "Master Content" in excel_file.sheet_names else excel_file.sheet_names[0]
        df = pd.read_excel(excel_file, sheet_name=sheet_name)
        
        for _, row in df.iterrows():
            question_text = row.get("Question Text (or Hint)")
            if pd.isna(question_text):
                continue
                
            q_type = str(row.get("Question Type", "MULTIPLE_CHOICE")).strip().upper()
            answer_val = row.get("Correct Answer")
            
            # ✅ Safely extract Explanation
            explanation_val = row.get("Explanation")
            explanation = str(explanation_val).strip() if not pd.isna(explanation_val) else ""
            
            # Standard Question Base (Ensure all properties exist so React doesn't crash)
            question_item = {
                "type": q_type,
                "question": str(question_text).strip(),
                "options": [],
                "answer": None,
                "explanation": explanation
            }

            # --- 1. MULTIPLE CHOICE ---
            if q_type == "MULTIPLE_CHOICE":
                answer_str = str(answer_val).strip() if not pd.isna(answer_val) else "1"
                
                # Gather options
                choices = []
                for i in range(1, 5):
                    opt_val = row.get(f"Choice {i} / Distractor")
                    if not pd.isna(opt_val):
                        choices.append(str(opt_val).strip())
                
                # Check if correct answer is provided as Text matching a choice, or as an Integer
                correct_idx = 0
                if answer_str in choices:
                    correct_idx = choices.index(answer_str)
                else:
                    try:
                        correct_idx = int(answer_str) - 1 # 1-based to 0-based index
                    except ValueError:
                        correct_idx = 0 # Fallback
                
                # Build options array
                options_list = []
                for i, choice in enumerate(choices):
                    options_list.append({
                        "text": choice,
                        "isCorrect": (i == correct_idx)
                    })
                
                question_item["options"] = options_list

            # --- 2. TRUE / FALSE ---
            elif q_type == "TRUE_FALSE":
                # Frontend relies on `answer: "TRUE" | "FALSE"` not the options array
                is_true = str(answer_val).strip().lower() in ["true", "t", "1", "yes", "صحیح"]
                question_item["answer"] = "TRUE" if is_true else "FALSE"

            # --- 3. FILL IN THE BLANK / SHORT ANSWER ---
            elif q_type in ["FILL_IN_BLANK", "FILL_IN_THE_BLANK", "SHORT_ANSWER", "DRAGGING_WORDS"]:
                question_item["answer"] = str(answer_val).strip() if not pd.isna(answer_val) else ""

            # --- 4. SENTENCE FACTORY ---
            elif q_type == "SENTENCE_FACTORY":
                distractors_list = []
                for i in range(1, 5):
                    dist_val = row.get(f"Choice {i} / Distractor")
                    if not pd.isna(dist_val):
                        distractors_list.append(str(dist_val).strip())
                        
                # Overwrite standard format with specific Sentence Factory schema
                question_item = {
                    "type": "SENTENCE_FACTORY",
                    "hint": str(question_text).strip(),
                    "correct_sentence": str(answer_val).strip() if not pd.isna(answer_val) else "",
                    "distractors": distractors_list,
                    "explanation": explanation
                }
            else:
                continue # Skip unrecognized types safely

            # --- ROUTING: Place the question into the correct UI Array ---
            placement = str(row.get("Target Placement", "LESSON_QUIZ")).strip().upper()
            
            if q_type == "SENTENCE_FACTORY" or "SENTENCE_FACTORY" in placement:
                sentence_factory_data.append(question_item)
            elif "PREP" in placement:
                preparation_task.append(question_item)
            elif "FINAL" in placement:
                final_test_data.append(question_item)
            else:
                lesson_quiz_data.append(question_item)

        return {
            "preparation_task": preparation_task,
            "lesson_quiz_data": lesson_quiz_data,
            "final_test_data": final_test_data,
            "sentence_factory_data": sentence_factory_data
        }

    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed parsing workbook configuration: {str(e)}")