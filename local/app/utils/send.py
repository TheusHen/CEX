import requests
import json
import logging

def send_cex_evaluation(data, endpoint='https://api.cex.theushen.me/api/cex'):
    logging.info(f"Sending to {endpoint}: {json.dumps(data, indent=2)}")
    try:
        response = requests.post(endpoint, json=data)
        logging.info(f"Response status: {response.status_code}")
        logging.info(f"Response body: {response.text}")
        if response.status_code == 200:
            print("✅ Result:")
            print(response.json())
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
    except Exception as e:
        logging.error(f"🚨 Failed to connect: {e}")