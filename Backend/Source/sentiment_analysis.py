from transformers import pipeline
import pandas as pd
import os
import shutil
from fastapi.responses import JSONResponse

nlp = None

def get_pipeline():
    global nlp
    if nlp is None:
        nlp = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
    return nlp

PROJECT_TEMP_DIR = os.path.join(os.getcwd(), "temp_storage")
os.makedirs(PROJECT_TEMP_DIR, exist_ok=True)

def generate(data: str):
    return get_pipeline()(data)

def analyze_csv(file_path):
    print("inside analyze csv!!!!!!!!!")
    try:
        try:
            df = pd.read_csv(file_path)
        except Exception as e:
            print(f"Error reading CSV file: {e}")

        required_columns = {"id", "text", "timestamp"}
        if not required_columns.issubset(df.columns):
            missing_columns = required_columns - set(df.columns)
            return JSONResponse(
                content={"error": f"Missing required columns: {', '.join(missing_columns)}"},
                status_code=400,
            )

        sentiments = []
        for _, row in df.iterrows():
            result = generate(row["text"])
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