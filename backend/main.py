import os
import re
from flask import Flask, jsonify, Blueprint, request
from dotenv import load_dotenv
from flask_cors import CORS, cross_origin
from utils.supabase import supabase, raise_when_api_error
from datetime import datetime

load_dotenv()

app = Flask(__name__)
CORS(app)

cex_bp = Blueprint("cex", __name__)
feedback_bp = Blueprint("feedback", __name__)

@app.route("/")
def root():
    return jsonify({"online": True})

@feedback_bp.route("/feedback/<string:iata>", methods=["GET"])
@cross_origin(origins="https://cex.theushen.me")
def get_feedback(iata):
    iata = iata.strip().upper()
    if not re.match(r"^[A-Z]{3}$", iata):
        return jsonify({"error": "Invalid IATA code"}), 400

    response = (
        supabase.table("airport_feedback")
        .select("*")
        .eq("iata", iata)
        .single()
        .execute()
    )
    try:
        raise_when_api_error(response)
    except Exception:
        return jsonify({"iata": iata, "positive": 0, "negative": 0})

    if not response.data:
        return jsonify({"iata": iata, "positive": 0, "negative": 0})

    return jsonify(response.data)

@feedback_bp.route("/feedback/<string:iata>", methods=["POST"])
@cross_origin(origins="https://cex.theushen.me")
def post_feedback(iata):
    iata = iata.strip().upper()
    if not re.match(r"^[A-Z]{3}$", iata):
        return jsonify({"error": "Invalid IATA code"}), 400

    data = request.get_json()
    if not data or ("positive" not in data and "negative" not in data):
        return jsonify({"error": "Missing positive/negative field."}), 400

    sel = supabase.table("airport_feedback").select("*").eq("iata", iata).single().execute()
    if sel.data:
        positive = sel.data.get("positive", 0) + (1 if data.get("positive") else 0)
        negative = sel.data.get("negative", 0) + (1 if data.get("negative") else 0)
        upd = (
            supabase.table("airport_feedback")
            .update({
                "positive": positive,
                "negative": negative,
                "updated_at": datetime.utcnow().isoformat()
            })
            .eq("iata", iata)
            .execute()
        )
        try:
            raise_when_api_error(upd)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        # upd.data pode ser uma lista ou dict, tente pegar o atualizado
        if upd.data and isinstance(upd.data, list) and len(upd.data) > 0:
            return jsonify(upd.data[0])
        elif upd.data and isinstance(upd.data, dict):
            return jsonify(upd.data)
        return jsonify({"iata": iata, "positive": positive, "negative": negative})
    else:
        ins = (
            supabase.table("airport_feedback")
            .insert({
                "iata": iata,
                "positive": 1 if data.get("positive") else 0,
                "negative": 1 if data.get("negative") else 0,
            })
            .execute()
        )
        try:
            raise_when_api_error(ins)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        if ins.data and isinstance(ins.data, list) and len(ins.data) > 0:
            return jsonify(ins.data[0])
        elif ins.data and isinstance(ins.data, dict):
            return jsonify(ins.data)
        return jsonify({"iata": iata, "positive": 1 if data.get("positive") else 0, "negative": 1 if data.get("negative") else 0})

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
def get_airports_cex_above_value(value):
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
def get_airports_cex_below_value(value):
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
        return jsonify({"error": "Missing or invalid JSON payload."}), 400

    iata = data.get("iata", "").strip().upper()
    if not re.match(r"^[A-Z]{3}$", iata):
        return jsonify({"error": "Invalid IATA code"}), 400

    exists = supabase.table("airports_cex").select("id").eq("iata", iata).single().execute()
    if exists.data:
        upd = supabase.table("airports_cex").update(data).eq("iata", iata).execute()
        try:
            raise_when_api_error(upd)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        supabase.table("airport_feedback").delete().eq("iata", iata).execute()
        return jsonify(upd.data)
    else:
        ins = supabase.table("airports_cex").insert(data).execute()
        try:
            raise_when_api_error(ins)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        return jsonify(ins.data)

@cex_bp.route("/airport_cex", methods=["GET"])
def get_airport_by_iata_query():
    iata = request.args.get("iata", "").strip().upper()
    if not re.match(r"^[A-Z]{3}$", iata):
        return jsonify({"error": "Missing or invalid 'iata' parameter."}), 400

    response = supabase.table("airports_cex").select("*").eq("iata", iata).single().execute()
    try:
        raise_when_api_error(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify(response.data)

app.register_blueprint(cex_bp, url_prefix="/api")
app.register_blueprint(feedback_bp, url_prefix="")

if __name__ != "__main__":
    app = app
else:
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)