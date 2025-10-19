from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Load your trained model
try:
    model = joblib.load('zentro_rf_pipeline.joblib')
    logger.info("✅ ML model loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load ML model: {e}")
    model = None

@app.route('/predict', methods=['POST'])
def predict():
    try:
        start_time = datetime.now()
        data = request.json
        
        if not data or 'applicants' not in data:
            return jsonify({'error': 'No applicant data provided'}), 400
        
        applicants = data['applicants']
        
        if not applicants:
            return jsonify({'error': 'Empty applicant list'}), 400
        
        logger.info(f"📊 Processing {len(applicants)} applicants")
        
        # Convert to DataFrame
        df = pd.DataFrame(applicants)
        
        # Ensure we have the required features
        required_features = ['age', 'income', 'loan_amount', 'credit_history', 'employment_length', 'debt_to_income']
        
        missing_features = [feat for feat in required_features if feat not in df.columns]
        if missing_features:
            return jsonify({'error': f'Missing features: {missing_features}'}), 400
        
        # Prepare features
        X = df[required_features]
        
        if model is None:
            # Fallback to rule-based scoring if model not loaded
            logger.warning("Using fallback rule-based scoring")
            predictions = []
            for _, applicant in df.iterrows():
                score = rule_based_score(applicant)
                risk_level = "low" if score >= 0.7 else "medium" if score >= 0.4 else "high"
                decision = "Approve" if risk_level == "low" else "Review" if risk_level == "medium" else "Reject"
                
                predictions.append({
                    **applicant.to_dict(),
                    'score': float(score),
                    'risk_level': risk_level,
                    'decision': decision,
                    'probability': float(min(score + 0.1, 0.99)),  # Mock confidence
                    'model_used': 'rule_based_fallback'
                })
        else:
            # Use ML model for predictions
            try:
                # Get probability predictions
                probabilities = model.predict_proba(X)
                predictions = model.predict(X)
                
                results = []
                for i, (_, applicant) in enumerate(df.iterrows()):
                    score = float(probabilities[i][1])  # Probability of positive class
                    risk_level = "low" if score >= 0.7 else "medium" if score >= 0.4 else "high"
                    decision = "Approve" if risk_level == "low" else "Review" if risk_level == "medium" else "Reject"
                    
                    results.append({
                        **applicant.to_dict(),
                        'score': score,
                        'risk_level': risk_level,
                        'decision': decision,
                        'probability': float(probabilities[i][1]),
                        'model_used': 'random_forest_ml'
                    })
                
                predictions = results
                
            except Exception as e:
                logger.error(f"ML prediction error: {e}")
                raise e
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        logger.info(f"✅ Successfully processed {len(predictions)} applicants in {processing_time:.2f}s")
        
        return jsonify({
            'predictions': predictions,
            'model_version': 'zentro_risk_v1',
            'processing_time': processing_time,
            'total_applicants': len(predictions)
        })
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({'error': str(e)}), 500

def rule_based_score(applicant):
    """Fallback rule-based scoring"""
    factors = {
        'income': min(1, applicant['income'] / 150000) * 0.3,
        'credit_history': (applicant['credit_history'] - 300) / 550 * 0.3,
        'employment': min(1, applicant['employment_length'] / 10) * 0.2,
        'age': min(1, (applicant['age'] - 18) / 50) * 0.1,
        'debt_ratio': (1 - min(1, applicant['debt_to_income'] / 0.5)) * 0.1
    }
    
    score = sum(factors.values())
    
    # Penalize high loan-to-income ratio
    loan_to_income = applicant['loan_amount'] / applicant['income']
    if loan_to_income > 0.5:
        score *= 0.8
    if loan_to_income > 1:
        score *= 0.7
    
    return min(1, max(0, score))

if __name__ == '__main__':
    logger.info("🚀 Starting ML Scoring Service on port 8000")
    app.run(host='0.0.0.0', port=8000, debug=False)