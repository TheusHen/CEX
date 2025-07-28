import os
import re
from flask import Flask, jsonify, Blueprint, request
from dotenv import load_dotenv
from flask_cors import CORS, cross_origin
from utils.supabase import supabase, raise_when_api_error
from datetime import datetime, timezone
import threading
import logging
import json

load_dotenv()

app = Flask(__name__)
CORS(app)

cex_bp = Blueprint("cex", __name__)
feedback_bp = Blueprint("feedback", __name__)

# Default weights
wC, wE, wX = 1, 1, 1

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
)

@app.route("/")
def root():
    return jsonify({"online": True})

@feedback_bp.route("/feedback/<string:iata>", methods=["GET"])
@cross_origin(origins="https://cex.theushen.me")
def get_feedback(iata):
    iata = iata.strip().upper()
    if not re.match(r"^[A-Z]{3}$", iata):
        return jsonify({"error": "Invalid IATA code"}), 400

    response = supabase.table("airport_feedback").select("*").eq("iata", iata).limit(1).execute()
    try:
        raise_when_api_error(response)
    except Exception:
        return jsonify({"iata": iata, "positive": 0, "negative": 0})

    if not response.data:
        return jsonify({"iata": iata, "positive": 0, "negative": 0})

    row = response.data[0]
    return jsonify({
        "iata": iata,
        "positive": row.get("positive", 0),
        "negative": row.get("negative", 0)
    })

@feedback_bp.route("/feedback/<string:iata>", methods=["POST"])
@cross_origin(origins="https://cex.theushen.me")
def post_feedback(iata):
    iata = iata.strip().upper()
    if not re.match(r"^[A-Z]{3}$", iata):
        return jsonify({"error": "Invalid IATA code"}), 400

    data = request.get_json()
    if not data or ("positive" not in data and "negative" not in data):
        return jsonify({"error": "Field positive/negative is required."}), 400

    sel = supabase.table("airport_feedback").select("*").eq("iata", iata).limit(1).execute()
    if sel.data:
        row = sel.data[0]
        positive = row.get("positive", 0) + (1 if data.get("positive") else 0)
        negative = row.get("negative", 0) + (1 if data.get("negative") else 0)
        upd = (
            supabase.table("airport_feedback")
            .update({
                "positive": positive,
                "negative": negative,
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
            .eq("iata", iata)
            .execute()
        )
        try:
            raise_when_api_error(upd)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        return jsonify({"iata": iata, "positive": positive, "negative": negative})
    else:
        ins = (
            supabase.table("airport_feedback")
            .insert({
                "iata": iata,
                "positive": 1 if data.get("positive") else 0,
                "negative": 1 if data.get("negative") else 0
                # Removed "created_at" as it does not exist in the table schema
            })
            .execute()
        )
        try:
            raise_when_api_error(ins)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        return jsonify({
            "iata": iata,
            "positive": 1 if data.get("positive") else 0,
            "negative": 1 if data.get("negative") else 0
        })

@cex_bp.route("/airports", methods=["GET"])
def get_airports():
    response = supabase.table("airports_cex").select("*").execute()
    try:
        raise_when_api_error(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify(response.data)

@cex_bp.route("/airports/<string:iata>", methods=["GET"])
def get_airport_by_iata_param(iata):
    iata = iata.strip().upper()
    if not re.match(r"^[A-Z]{3}$", iata):
        return jsonify({"error": "Invalid IATA code"}), 400

    response = supabase.table("airports_cex").select("*").eq("iata", iata).single().execute()
    try:
        raise_when_api_error(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify(response.data)

@cex_bp.route("/airports/order/desc", methods=["GET"])
def get_airports_desc():
    response = supabase.table("airports_cex").select("*").order("cex", desc=True).execute()
    try:
        raise_when_api_error(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify(response.data)

@cex_bp.route("/airports/order/asc", methods=["GET"])
def get_airports_asc():
    response = supabase.table("airports_cex").select("*").order("cex", desc=False).execute()
    try:
        raise_when_api_error(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify(response.data)

@cex_bp.route("/airports/search/<string:name>", methods=["GET"])
def search_airports_by_name(name):
    query = name.strip()
    if not query:
        return jsonify([])
    response = (
        supabase.table("airports_cex")
        .select("*")
        .ilike("airport_name", f"%{query}%")
        .order("cex", desc=True)
        .execute()
    )
    try:
        raise_when_api_error(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify(response.data)

@cex_bp.route("/airports/cex/above/<float:value>", methods=["GET"])
def get_airports_cex_acima(value):
    response = (
        supabase.table("airports_cex")
        .select("*")
        .gte("cex", value)
        .order("cex", desc=True)
        .execute()
    )
    try:
        raise_when_api_error(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify(response.data)

@cex_bp.route("/airports/cex/below/<float:value>", methods=["GET"])
def get_airports_cex_abaixo(value):
    response = (
        supabase.table("airports_cex")
        .select("*")
        .lt("cex", value)
        .order("cex", desc=False)
        .execute()
    )
    try:
        raise_when_api_error(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify(response.data)

@cex_bp.route("/cex", methods=["POST"])
@cross_origin(origins="https://cex.theushen.me")
def create_cex():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON."}), 400

    iata = data.get("iata") or data.get("IATA") or ""
    iata = iata.strip().upper()
    if not re.match(r"^[A-Z]{3}$", iata):
        return jsonify({"error": "Invalid IATA code"}), 400

    airport_name = data.get("airport") or data.get("Airport")
    if not airport_name:
        return jsonify({"error": "Missing airport name"}), 400

    filtered_data = {   
        "iata": iata,
        "airport": airport_name,
        "comfort": round(data.get("C", 0), 2),
        "efficiency": round(data.get("E", 0), 2),
        "aesthetics": round(data.get("X", 0), 2),
        "cex": round(data.get("CEX", 0), 2)
    }

    try:
        exists = supabase.table("airports_cex").select("id").eq("iata", iata).single().execute()
        row_exists = True
    except Exception as e:
        if "0 rows" in str(e) or "PGRST116" in str(e):
            row_exists = False
        else:
            return jsonify({"error": str(e)}), 500

    try:
        if row_exists:
            upd = supabase.table("airports_cex").update(filtered_data).eq("iata", iata).execute()
            raise_when_api_error(upd)
            supabase.table("airport_feedback").delete().eq("iata", iata).execute()
            return jsonify(upd.data)
        else:
            ins = supabase.table("airports_cex").insert(filtered_data).execute()
            raise_when_api_error(ins)
            return jsonify(ins.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@cex_bp.route("/airport_cex", methods=["GET"])
def get_airport_by_iata_query():
    iata = request.args.get("iata", "").strip().upper()
    if not re.match(r"^[A-Z]{3}$", iata):
        return jsonify({"error": "Invalid 'iata' parameter."}), 400

    try:
        response = supabase.table("airports_cex").select("*").eq("iata", iata).single().execute()
        if not response.data:
            return jsonify({}), 200
        return jsonify(response.data)
    except Exception as e:
        if "0 rows" in str(e) or "PGRST116" in str(e):
            return jsonify({}), 200
        return jsonify({"error": str(e)}), 500

@app.route('/calculate_cex', methods=['POST'])
def calculate_cex():
    data = request.get_json()

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

        return jsonify(result), 200

    except KeyError as e:
        logging.error(f"Missing field in payload: {str(e)}")
        return jsonify({"error": f"Missing field: {str(e)}"}), 400
    except Exception as e:
        logging.error(f"Unhandled exception: {str(e)}")
        return jsonify({"error": str(e)}), 500

app.register_blueprint(cex_bp, url_prefix="/api")
app.register_blueprint(feedback_bp, url_prefix="")

if __name__ != "__main__":
    app = app
else:
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)