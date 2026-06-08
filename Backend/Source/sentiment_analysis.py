import os
import pandas as pd
import shutil
from fastapi.responses import JSONResponse
import google.generativeai as genai

# Configure Gemini
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-pro")

PROJECT_TEMP_DIR = os.path.join(os.getcwd(), "temp_storage")
os.makedirs(PROJECT_TEMP_DIR, exist_ok=True)


def generate(text: str):
    """Use Gemini to perform sentiment analysis."""
    prompt = f"""Analyze the sentiment of the following text and respond with ONLY a JSON object in this exact format:
{{"label": "POSITIVE", "score": 0.95}}

Rules:
- label must be exactly "POSITIVE" or "NEGATIVE"
- score must be a float between 0.0 and 1.0 representing confidence
- Do not include any other text, explanation, or markdown

Text to analyze: "{text}"
"""
    try:
        response = model.generate_content(prompt)
        raw = response.text.strip()
        # Clean up any markdown backticks if present
        raw = raw.replace("```json", "").replace("```", "").strip()
        import json
        result = json.loads(raw)
        return [{"label": result["label"], "score": float(result["score"])}]
    except Exception as e:
        print(f"Gemini error: {e}")
        # Fallback to neutral positive if Gemini fails
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
    """Clean up the temporary directory."""
    shutil.rmtree(PROJECT_TEMP_DIR, ignore_errors=True)