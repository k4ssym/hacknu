from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
import joblib
import pandas as pd
import numpy as np
import logging
from io import StringIO
import tempfile
import os
from typing import List

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml_api")

# Constants
RAW_FEATURES = [
    'age', 'income', 'loan_amount',
    'credit_history', 'employment_length', 'debt_to_income'
]

app = FastAPI()

# Load model at startup
model = None

@app.on_event("startup")
def load_model():
    global model
    try:
        model = joblib.load("ml_ZENTRO/ZENTRO_rf_pipeline.joblib")
        logger.info(f"✅ Model loaded. Expects {model.n_features_in_} features")
    except Exception as e:
        logger.error(f"❌ Model loading failed: {e}")
        raise

@app.post("/api/batch-score")
async def batch_score(file: UploadFile = File(...)):
    temp_file_path = None
    try:
        # Read and validate CSV
        contents = await file.read()
        csv_data = StringIO(contents.decode('utf-8'))
        df = pd.read_csv(csv_data)
        
        # Validate columns
        missing_cols = set(RAW_FEATURES) - set(df.columns)
        if missing_cols:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {missing_cols}"
            )
        
        # Keep only needed columns
        input_df = df[RAW_FEATURES].copy()
        
        # Get predictions
        probabilities = model.predict_proba(input_df)
        df['default_probability'] = probabilities[:, 1]
        df['risk_level'] = np.select(
            [df['default_probability'] > 0.7, df['default_probability'] > 0.3],
            ['High', 'Medium'],
            default='Low'
        )
        
        # Save results to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
            temp_file_path = tmp.name
            df.to_csv(tmp, index=False)
        
        # Calculate stats
        risk_counts = df['risk_level'].value_counts()
        
        return JSONResponse({
            "status": "success",
            "rows_processed": len(df),
            "high_risk": int(risk_counts.get('High', 0)),
            "medium_risk": int(risk_counts.get('Medium', 0)),
            "download_link": f"/api/download-results?path={temp_file_path}"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch scoring error: {e}")
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@app.get("/api/download-results")
async def download_results(path: str):
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Results file not found")
    
    try:
        return FileResponse(
            path,
            media_type="text/csv",
            filename="scored_results.csv"
        )
    finally:
        if os.path.exists(path):
            os.unlink(path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)