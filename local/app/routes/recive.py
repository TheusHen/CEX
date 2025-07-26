from flask import Flask, request, jsonify
import threading
import logging
import json

app = Flask(__name__)

# Default weights
wC, wE, wX = 1, 1, 1

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
)

@app.route('/calculate_cex', methods=['POST'])
def calculate_cex():
    from utils.send import send_cex_evaluation
    data = request.get_json()

    logging.info(f"Received payload: {json.dumps(data, indent=2)}")

    try:
        # Validate required fields
        required_fields = [
            'Sp', 'Ac', 'Da', 'Zl', 'To', 'Ng', 'Rt', 'Pm',
            'Va', 'Id', 'Sc', 'Lu', 'iata', 'airport'
        ]
        for field in required_fields:
            if field not in data:
                logging.warning(f"Missing field: {field}")
                raise KeyError(field)

        # Validate numeric fields
        numeric_fields = [
            'Sp', 'Ac', 'Da', 'Zl', 'To', 'Ng', 'Rt', 'Pm',
            'Va', 'Id', 'Sc', 'Lu'
        ]
        for field in numeric_fields:
            value = data[field]
            if not isinstance(value, (int, float)):
                logging.warning(f"Field {field} is not a number: {value}")
                return jsonify({"error": f"Field {field} must be a number"}), 400

        # Comfort (C)
        C = (data['Sp'] + data['Ac'] + data['Da'] + data['Zl']) / 4

        # Efficiency (E)
        E = (data['To'] + data['Ng'] + data['Rt'] + data['Pm']) / 4

        # Aesthetics (X)
        X = (data['Va'] + data['Id'] + data['Sc'] + data['Lu']) / 4

        # Final CEX calculation
        CEX = (wC * C + wE * E + wX * X) / (wC + wE + wX)

        result = {
            "IATA": data['iata'],
            "Airport": data['airport'],
            "C": round(C, 2),
            "E": round(E, 2),
            "X": round(X, 2),
            "CEX": round(CEX, 2)
        }

        # Log result
        logging.info(f"Calculated result: {json.dumps(result, indent=2)}")

        # Send the original data (not the result!) to backend in a separate thread
        def send_data_thread():
            try:
                send_cex_evaluation(data)
            except Exception as e:
                logging.error(f"Error in send_cex_evaluation: {str(e)}")

        threading.Thread(target=send_data_thread).start()

        return jsonify(result), 200

    except KeyError as e:
        logging.error(f"Missing field in payload: {str(e)}")
        return jsonify({"error": f"Missing field: {str(e)}"}), 400
    except Exception as e:
        logging.error(f"Unhandled exception: {str(e)}")
        return jsonify({"error": str(e)}), 500
