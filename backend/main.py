import os
from flask import Flask, jsonify, Blueprint, request
from dotenv import load_dotenv
from utils.supabase import supabase, raise_when_api_error

load_dotenv()

app = Flask(__name__)

@app.route("/")
def root():
    return jsonify({"online": True})

cex_bp = Blueprint("cex", __name__)

@cex_bp.route("/airports", methods=["GET"])
def get_airports():
    response = supabase.table("airports_cex").select("*").execute()
    try:
        raise_when_api_error(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify(response.data)

@cex_bp.route("/airport/<string:airport_id>", methods=["GET"])
def get_airport(airport_id):
    response = supabase.table("airports_cex").select("*").eq("airport_id", airport_id).single().execute()
    try:
        raise_when_api_error(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify(response.data)

@cex_bp.route("/airports/desc", methods=["GET"])
def get_airports_desc():
    response = supabase.table("airports_cex").select("*").order("cex", desc=True).execute()
    try:
        raise_when_api_error(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify(response.data)

@cex_bp.route("/airports/asc", methods=["GET"])
def get_airports_asc():
    response = supabase.table("airports_cex").select("*").order("cex", desc=False).execute()
    try:
        raise_when_api_error(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify(response.data)

@cex_bp.route("/search", methods=["GET"])
def search_airports():
    query = request.args.get("q", "").strip()

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

@cex_bp.route("/airports/cex_above", methods=["GET"])
def get_airports_cex_above():
    response = (
        supabase.table("airports_cex")
        .select("*")
        .gte("cex", 0.5)
        .order("cex", desc=True)
        .execute()
    )

    try:
        raise_when_api_error(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify(response.data)

@cex_bp.route("/airports/cex_below", methods=["GET"])
def get_airports_cex_below():
    response = (
        supabase.table("airports_cex")
        .select("*")
        .lt("cex", 0.5)
        .order("cex", desc=False)
        .execute()
    )

    try:
        raise_when_api_error(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify(response.data)

@cex_bp.route("/cex", methods=["POST"])
def create_cex():
    data = request.get_json()

    if not data:
        return jsonify({"error": "JSON payload ausente ou inválido."}), 400

    response = supabase.table("airports_cex").insert(data).execute()

    try:
        raise_when_api_error(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify(response.data)

app.register_blueprint(cex_bp, url_prefix="/api")

# Vercel compatibility
if __name__ != "__main__":
    app = app
else:
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)

