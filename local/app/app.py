import os
import sys
import threading
import webview
from flask import Flask, request, jsonify
from flask_cors import CORS

disable_dist = '--disable-dist' in sys.argv

if not disable_dist:
    from utils.get_dist import build_and_move_dist
    try:
        build_and_move_dist()
    except Exception as e:
        print(f"Error building and moving dist: {e}")

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow CORS for everything

# Default weights
wC, wE, wX = 1, 1, 1

@app.route('/calculate_cex', methods=['POST'])
def calculate_cex():
    from utils.send import send_cex_evaluation  # moved import here to avoid circular import
    data = request.get_json()

    try:
        # Validate required fields
        required_fields = ['Sp', 'Ac', 'Da', 'Zl', 'To', 'Ng', 'Rt', 'Pm', 'Va', 'Id', 'Sc', 'Lu', 'iata', 'airport']
        for field in required_fields:
            if field not in data:
                raise KeyError(field)

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

        # FIX: send the full data, not just the result
        threading.Thread(target=send_cex_evaluation, args=(data,)).start()

        return jsonify(result), 200

    except KeyError as e:
        return jsonify({"error": f"Missing field: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def run_flask():
    app.run(debug=True, port=5000, use_reloader=False)

if __name__ == '__main__':
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()

    if not disable_dist:
        dist_path = os.path.abspath('./dist')
        index_path = os.path.join(dist_path, 'index.html')

        webview.create_window(
            "CEX Map",
            f'file://{index_path}',
            width=1024,
            height=768
        )
        webview.start()
    else:
        print("🟡 Running only the Flask server at http://localhost:5000 (--disable-dist mode)")
        flask_thread.join()