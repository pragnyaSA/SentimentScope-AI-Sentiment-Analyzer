import os
import re
import json
import pandas as pd
import shutil
from fastapi.responses import JSONResponse
from google import genai

# Configure Gemini
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

PROJECT_TEMP_DIR = os.path.join(os.getcwd(), "temp_storage")
os.makedirs(PROJECT_TEMP_DIR, exist_ok=True)


def generate(text: str):
    """Use Gemini to perform sentiment analysis."""
    prompt = f"""You are a precise sentiment analysis model. Analyze the sentiment of the text below.

Rules:
- POSITIVE: clearly happy, satisfied, praising, or enthusiastic text
- NEGATIVE: clearly unhappy, dissatisfied, complaining, or critical text
- NEUTRAL: mixed opinions, ambiguous, or factual statements with no clear sentiment

Respond with ONLY valid JSON, no explanation, no markdown, no backticks.
Format: {{"label": "POSITIVE", "score": 0.95}}
- label: must be exactly "POSITIVE", "NEGATIVE", or "NEUTRAL"
- score: your confidence between 0.0 and 1.0

Text: {text}"""

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        raw = response.text.strip()
        print(f"Gemini raw response: {raw}")

        # Remove markdown if present
        raw = re.sub(r'```json|```', '', raw).strip()

        # Extract JSON using regex
        match = re.search(r'\{.*?\}', raw, re.DOTALL)
        if match:
            result = json.loads(match.group())
            label = result.get("label", "NEUTRAL").upper()
            score = float(result.get("score", 0.5))
            if label not in ["POSITIVE", "NEGATIVE", "NEUTRAL"]:
                label = "NEUTRAL"
            score = max(0.0, min(1.0, score))  # clamp to [0, 1]
            return [{"label": label, "score": score}]
        else:
            print(f"No JSON found in response: {raw}")
            return [{"label": "NEUTRAL", "score": 0.5}]  # ✅ neutral fallback

    except Exception as e:
        print(f"Gemini error: {e}")
        return [{"label": "NEUTRAL", "score": 0.5}]  # ✅ neutral fallback, not POSITIVE


def analyze_csv(file_path):
    """Analyze sentiment of text data in a CSV file using Gemini."""
    try:
        df = pd.read_csv(file_path)

        required_columns = {"id", "text"}
        if not required_columns.issubset(df.columns):
            missing_columns = required_columns - set(df.columns)
            return JSONResponse(
                content={"error": f"Missing required columns: {', '.join(missing_columns)}"},
                status_code=400,
            )

        # timestamp is optional
        has_timestamp = "timestamp" in df.columns

        sentiments = []
        for _, row in df.iterrows():
            result = generate(str(row["text"]))
            entry = {
                "id": row["id"],
                "text": row["text"],
                "sentiment": result[0]["label"],
                "confidence": result[0]["score"],
            }
            if has_timestamp:
                entry["timestamp"] = row["timestamp"]
            sentiments.append(entry)

        return sentiments

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


def cleanup_temp_storage():
    shutil.rmtree(PROJECT_TEMP_DIR, ignore_errors=True)