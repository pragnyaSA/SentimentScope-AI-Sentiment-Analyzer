import os
import re
import json
import pandas as pd
import shutil
from fastapi.responses import JSONResponse
import google.generativeai as genai

# Configure Gemini
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")  # flash is faster and cheaper

PROJECT_TEMP_DIR = os.path.join(os.getcwd(), "temp_storage")
os.makedirs(PROJECT_TEMP_DIR, exist_ok=True)


def generate(text: str):
    """Use Gemini to perform sentiment analysis."""
    prompt = f"""You are a sentiment analysis model. Analyze the sentiment of the text below.
Respond with ONLY valid JSON, no explanation, no markdown, no backticks.
Format: {{"label": "POSITIVE", "score": 0.95}}
- label: must be "POSITIVE" or "NEGATIVE"
- score: confidence between 0.0 and 1.0

Text: {text}"""

    try:
        response = model.generate_content(prompt)
        raw = response.text.strip()
        print(f"Gemini raw response: {raw}")
        
        # Remove markdown if present
        raw = re.sub(r'```json|```', '', raw).strip()
        
        # Extract JSON using regex if needed
        match = re.search(r'\{.*?\}', raw, re.DOTALL)
        if match:
            result = json.loads(match.group())
            label = result.get("label", "POSITIVE").upper()
            score = float(result.get("score", 0.5))
            if label not in ["POSITIVE", "NEGATIVE"]:
                label = "POSITIVE"
            return [{"label": label, "score": score}]
        else:
            print(f"No JSON found in response: {raw}")
            return [{"label": "POSITIVE", "score": 0.5}]
            
    except Exception as e:
        print(f"Gemini error: {e}")
        return [{"label": "POSITIVE", "score": 0.5}]


def analyze_csv(file_path):
    """Analyze sentiment of text data in a CSV file using Gemini."""
    try:
        df = pd.read_csv(file_path)

        required_columns = {"id", "text", "timestamp"}
        if not required_columns.issubset(df.columns):
            missing_columns = required_columns - set(df.columns)
            return JSONResponse(
                content={"error": f"Missing required columns: {', '.join(missing_columns)}"},
                status_code=400,
            )

        sentiments = []
        for _, row in df.iterrows():
            result = generate(str(row["text"]))
            sentiments.append({
                "id": row["id"],
                "text": row["text"],
                "sentiment": result[0]["label"],
                "confidence": result[0]["score"],
                "timestamp": row["timestamp"]
            })

        return sentiments

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


def cleanup_temp_storage():
    shutil.rmtree(PROJECT_TEMP_DIR, ignore_errors=True)