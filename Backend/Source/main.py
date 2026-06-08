import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import shutil
from pydantic import BaseModel
from sentiment_analysis import analyze_csv  # ✅ fixed import

# File upload directory
PROJECT_TEMP_DIR = Path(os.getcwd()) / "temp_storage"
PROJECT_TEMP_DIR.mkdir(parents=True, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    shutil.rmtree(PROJECT_TEMP_DIR, ignore_errors=True)  # cleanup on shutdown

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SentimentAnalysisRequest(BaseModel):
    filename: str

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_location = PROJECT_TEMP_DIR / file.filename
        with open(file_location, "wb") as f:       # ✅ actually saves the file
            shutil.copyfileobj(file.file, f)
        return {"filename": file.filename, "message": "File uploaded successfully"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Failed to upload file. Error: {str(e)}"})

@app.post("/sentimentanalysis")
def analyze_uploaded_csv(file: UploadFile = File(...)):
    print("inside analyze sentiments!!!")

    if file.content_type != "text/csv":
        return JSONResponse(content={"error": "Only .csv files are allowed."}, status_code=400)

    try:
        file_path = os.path.join(PROJECT_TEMP_DIR, file.filename)
        with open(file_path, "wb") as temp_file:
            shutil.copyfileobj(file.file, temp_file)

        results = analyze_csv(file_path)
        print("Results:", results)
        return {"results": results}

    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Sentiment analysis failed. Error: {str(e)}"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
