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
feedback_bp = Blueprint("feedback", __name__)

@feedback_bp.route("/feedback/<string:iata>", methods=["GET"])
def get_feedback(iata):
    response = (
        supabase.table("airport_feedback")
        .select("*")
        .eq("iata", iata.upper())
        .single()
        .execute()
    )
    try:
        raise_when_api_error(response)
    except Exception as e:
        # If not found, return default zeros
        return jsonify({"iata": iata, "positive": 0, "negative": 0})
    # If response has no data, also return zeros
    if not response.data:
        return jsonify({"iata": iata, "positive": 0, "negative": 0})
    return jsonify(response.data)

@feedback_bp.route("/feedback/<string:iata>", methods=["POST"])
def post_feedback(iata):
    data = request.get_json()
    if not data or ("positive" not in data and "negative" not in data):
        return jsonify({"error": "Missing positive/negative field."}), 400

    sel = supabase.table("airport_feedback").select("*").eq("iata", iata.upper()).single().execute()
    if sel.data:
        positive = sel.data.get("positive", 0) + (1 if data.get("positive") else 0)
        negative = sel.data.get("negative", 0) + (1 if data.get("negative") else 0)
        upd = (
            supabase.table("airport_feedback")
            .update({"positive": positive, "negative": negative, "updated_at": "now()"})
            .eq("iata", iata.upper())
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
                "iata": iata.upper(),
                "positive": 1 if data.get("positive") else 0,
                "negative": 1 if data.get("negative") else 0,
            })
            .execute()
        )
        try:
            raise_when_api_error(ins)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        return jsonify(ins.data[0])

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
    response = supabase.table("airports_cex").select("*").eq("iata", iata.upper()).single().execute()
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
def create_cex():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Missing or invalid JSON payload."}), 400

    iata = data.get("iata", "").upper()
    exists = supabase.table("airports_cex").select("id").eq("iata", iata).single().execute()
    if exists.data:
        upd = supabase.table("airports_cex").update(data).eq("iata", iata).execute()
        try:
            raise_when_api_error(upd)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        del_fb = supabase.table("airport_feedback").delete().eq("iata", iata).execute()
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
    if not iata:
        return jsonify({"error": "Missing 'iata' parameter."}), 400

    response = supabase.table("airports_cex").select("*").eq("iata", iata).single().execute()
    try:
        raise_when_api_error(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify(response.data)

app.register_blueprint(cex_bp, url_prefix="/api")
app.register_blueprint(feedback_bp, url_prefix="")

# Vercel compatibility
if __name__ != "__main__":
    app = app
else:
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
