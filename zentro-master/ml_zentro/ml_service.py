from flask import Flask, request, jsonify
import joblib
import numpy as np
import os

app = Flask(__name__)

# Load your trained model
MODEL_PATH = 'zentro_rf_pipeline.joblib'
model = joblib.load(MODEL_PATH)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get data from POST request
        data = request.get_json()
        features = data['features']
        
        # Convert to numpy array
        features_array = np.array(features)
        
        # Make predictions (assuming your model outputs probabilities)
        probabilities = model.predict_proba(features_array)
        
        # Return probabilities
        return jsonify({
            'status': 'success',
            'probabilities': probabilities.tolist()
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)