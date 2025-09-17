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

# =================== RANKING ENDPOINTS ===================

@cex_bp.route("/rankings/global", methods=["GET"])
def get_global_ranking():
    """Get global airport ranking with optional limit"""
    limit = request.args.get("limit", 50, type=int)
    if limit > 100:
        limit = 100
        
    response = (
        supabase.table("airports_cex")
        .select("iata, airport, comfort, efficiency, aesthetics, cex, created_at")
        .order("cex", desc=True)
        .limit(limit)
        .execute()
    )
    try:
        raise_when_api_error(response)
        # Add ranking position to each airport
        for i, airport in enumerate(response.data):
            airport["rank"] = i + 1
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@cex_bp.route("/rankings/category", methods=["GET"])
def get_category_ranking():
    """Get ranking by specific category (comfort, efficiency, aesthetics)"""
    category = request.args.get("category", "").lower()
    limit = request.args.get("limit", 20, type=int)
    
    if category not in ["comfort", "efficiency", "aesthetics"]:
        return jsonify({"error": "Category must be one of: comfort, efficiency, aesthetics"}), 400
    
    if limit > 100:
        limit = 100
        
    response = (
        supabase.table("airports_cex")
        .select("iata, airport, comfort, efficiency, aesthetics, cex, created_at")
        .order(category, desc=True)
        .limit(limit)
        .execute()
    )
    try:
        raise_when_api_error(response)
        # Add ranking position to each airport
        for i, airport in enumerate(response.data):
            airport["rank"] = i + 1
            airport["category_score"] = airport[category]
        return jsonify({
            "category": category,
            "rankings": response.data
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@cex_bp.route("/rankings/region", methods=["GET"])
def get_region_ranking():
    """Get ranking filtered by region/country (based on IATA code patterns)"""
    region = request.args.get("region", "").upper()
    limit = request.args.get("limit", 20, type=int)
    
    if not region:
        return jsonify({"error": "Region parameter is required"}), 400
    
    if limit > 100:
        limit = 100
    
    # Simple region filtering based on IATA patterns
    # This is a basic implementation - can be enhanced with actual country/region data
    response = (
        supabase.table("airports_cex")
        .select("iata, airport, comfort, efficiency, aesthetics, cex, created_at")
        .ilike("iata", f"{region}%")
        .order("cex", desc=True)
        .limit(limit)
        .execute()
    )
    try:
        raise_when_api_error(response)
        # Add ranking position to each airport
        for i, airport in enumerate(response.data):
            airport["rank"] = i + 1
        return jsonify({
            "region": region,
            "rankings": response.data
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@cex_bp.route("/rankings/historical", methods=["GET"])
def get_historical_ranking():
    """Get historical data and trends for airports"""
    iata = request.args.get("iata", "").upper()
    days = request.args.get("days", 30, type=int)
    
    if days > 365:
        days = 365
    
    if iata:
        # Get data for specific airport
        if not re.match(r"^[A-Z]{3}$", iata):
            return jsonify({"error": "Invalid IATA code"}), 400
            
        # For now, return current data (can be enhanced with actual historical tracking)
        response = (
            supabase.table("airports_cex")
            .select("*")
            .eq("iata", iata)
            .execute()
        )
        try:
            raise_when_api_error(response)
            return jsonify({
                "airport": iata,
                "historical_data": response.data,
                "note": "Historical tracking will be enhanced in future versions"
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        # Get top performers over time
        response = (
            supabase.table("airports_cex")
            .select("iata, airport, cex, created_at")
            .order("cex", desc=True)
            .limit(10)
            .execute()
        )
        try:
            raise_when_api_error(response)
            return jsonify({
                "top_performers": response.data,
                "period": f"Last {days} days",
                "note": "Historical tracking will be enhanced in future versions"
            })
        except Exception as e:
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

# =================== ANALYTICS ENDPOINTS ===================

@cex_bp.route("/analytics/overview", methods=["GET"])
def get_analytics_overview():
    """Get comprehensive analytics overview"""
    try:
        # Get all airports data
        response = supabase.table("airports_cex").select("*").execute()
        raise_when_api_error(response)
        
        data = response.data
        if not data:
            return jsonify({"error": "No data available"}), 404
        
        # Calculate statistics
        total_airports = len(data)
        cex_scores = [float(airport['cex']) for airport in data if airport['cex'] is not None]
        comfort_scores = [float(airport['comfort']) for airport in data if airport['comfort'] is not None]
        efficiency_scores = [float(airport['efficiency']) for airport in data if airport['efficiency'] is not None]
        aesthetics_scores = [float(airport['aesthetics']) for airport in data if airport['aesthetics'] is not None]
        
        if not cex_scores:
            return jsonify({"error": "No valid CEX scores available"}), 404
        
        analytics = {
            "total_airports": total_airports,
            "average_cex": round(sum(cex_scores) / len(cex_scores), 2),
            "max_cex": max(cex_scores),
            "min_cex": min(cex_scores),
            "average_comfort": round(sum(comfort_scores) / len(comfort_scores), 2) if comfort_scores else 0,
            "average_efficiency": round(sum(efficiency_scores) / len(efficiency_scores), 2) if efficiency_scores else 0,
            "average_aesthetics": round(sum(aesthetics_scores) / len(aesthetics_scores), 2) if aesthetics_scores else 0,
            "score_distribution": {
                "excellent": len([s for s in cex_scores if s >= 8.0]),
                "good": len([s for s in cex_scores if 6.0 <= s < 8.0]),
                "average": len([s for s in cex_scores if 4.0 <= s < 6.0]),
                "poor": len([s for s in cex_scores if s < 4.0])
            }
        }
        
        return jsonify(analytics)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@cex_bp.route("/analytics/trends", methods=["GET"])
def get_trends():
    """Get trends and patterns in airport ratings"""
    try:
        response = supabase.table("airports_cex").select("*").order("created_at", desc=True).execute()
        raise_when_api_error(response)
        
        data = response.data
        if not data:
            return jsonify({"error": "No data available"}), 404
        
        # Group by month (simplified - can be enhanced)
        monthly_stats = {}
        for airport in data:
            # Extract month from created_at (simplified parsing)
            month = airport['created_at'][:7] if airport['created_at'] else "unknown"
            if month not in monthly_stats:
                monthly_stats[month] = {
                    "count": 0,
                    "total_cex": 0,
                    "airports": []
                }
            monthly_stats[month]["count"] += 1
            monthly_stats[month]["total_cex"] += float(airport['cex']) if airport['cex'] else 0
            monthly_stats[month]["airports"].append(airport['iata'])
        
        # Calculate monthly averages
        trends = []
        for month, stats in monthly_stats.items():
            trends.append({
                "month": month,
                "average_cex": round(stats["total_cex"] / stats["count"], 2) if stats["count"] > 0 else 0,
                "airports_evaluated": stats["count"],
                "airports": stats["airports"]
            })
        
        return jsonify({"trends": sorted(trends, key=lambda x: x["month"])})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@cex_bp.route("/analytics/compare", methods=["GET"])
def compare_airports():
    """Compare multiple airports"""
    iata_codes = request.args.get("airports", "").upper().split(",")
    iata_codes = [code.strip() for code in iata_codes if code.strip()]
    
    if len(iata_codes) < 2:
        return jsonify({"error": "At least 2 airport codes required for comparison"}), 400
    
    if len(iata_codes) > 10:
        return jsonify({"error": "Maximum 10 airports can be compared at once"}), 400
    
    try:
        airports_data = []
        not_found = []
        
        for iata in iata_codes:
            if not re.match(r"^[A-Z]{3}$", iata):
                not_found.append(iata)
                continue
            
            try:
                response = supabase.table("airports_cex").select("*").eq("iata", iata).single().execute()
                if response.data:
                    airports_data.append(response.data)
                else:
                    not_found.append(iata)
            except Exception as e:
                # Handle case when airport is not found (0 rows)
                if "0 rows" in str(e) or "PGRST116" in str(e):
                    not_found.append(iata)
                else:
                    raise e
        
        if len(airports_data) < 2:
            available_airports = supabase.table("airports_cex").select("iata, airport").limit(10).execute()
            available_list = [f"{a['iata']} ({a['airport']})" for a in available_airports.data] if available_airports.data else []
            
            return jsonify({
                "error": "Not enough valid airports found for comparison",
                "requested": iata_codes,
                "not_found": not_found,
                "found": [a['iata'] for a in airports_data],
                "suggestion": f"Try using some of these available airports: {', '.join(available_list[:5])}"
            }), 404
        
        # Calculate comparison metrics
        comparison = {
            "airports": airports_data,
            "not_found": not_found if not_found else None,
            "best_comfort": max(airports_data, key=lambda x: float(x['comfort']) if x['comfort'] else 0),
            "best_efficiency": max(airports_data, key=lambda x: float(x['efficiency']) if x['efficiency'] else 0),
            "best_aesthetics": max(airports_data, key=lambda x: float(x['aesthetics']) if x['aesthetics'] else 0),
            "best_overall": max(airports_data, key=lambda x: float(x['cex']) if x['cex'] else 0),
            "average_scores": {
                "comfort": round(sum(float(a['comfort']) if a['comfort'] else 0 for a in airports_data) / len(airports_data), 2),
                "efficiency": round(sum(float(a['efficiency']) if a['efficiency'] else 0 for a in airports_data) / len(airports_data), 2),
                "aesthetics": round(sum(float(a['aesthetics']) if a['aesthetics'] else 0 for a in airports_data) / len(airports_data), 2),
                "cex": round(sum(float(a['cex']) if a['cex'] else 0 for a in airports_data) / len(airports_data), 2)
            }
        }
        
        return jsonify(comparison)
    except Exception as e:
        logging.error(f"Error in compare_airports: {str(e)}")
        return jsonify({"error": str(e)}), 500

@cex_bp.route("/recommendations/similar", methods=["GET"])
def get_similar_airports():
    """Get recommendations for similar airports"""
    iata = request.args.get("iata", "").upper().strip()
    limit = request.args.get("limit", 5, type=int)
    
    if not re.match(r"^[A-Z]{3}$", iata):
        return jsonify({"error": "Valid IATA code required"}), 400
    
    if limit > 20:
        limit = 20
    
    try:
        # Get target airport data
        target_response = supabase.table("airports_cex").select("*").eq("iata", iata).single().execute()
        if not target_response.data:
            return jsonify({"error": "Airport not found"}), 404
        
        target = target_response.data
        target_cex = float(target['cex']) if target['cex'] else 0
        target_comfort = float(target['comfort']) if target['comfort'] else 0
        target_efficiency = float(target['efficiency']) if target['efficiency'] else 0
        target_aesthetics = float(target['aesthetics']) if target['aesthetics'] else 0
        
        # Get all other airports
        all_response = supabase.table("airports_cex").select("*").neq("iata", iata).execute()
        raise_when_api_error(all_response)
        
        if not all_response.data:
            return jsonify({"error": "No other airports available for comparison"}), 404
        
        # Calculate similarity scores
        similar_airports = []
        for airport in all_response.data:
            airport_cex = float(airport['cex']) if airport['cex'] else 0
            airport_comfort = float(airport['comfort']) if airport['comfort'] else 0
            airport_efficiency = float(airport['efficiency']) if airport['efficiency'] else 0
            airport_aesthetics = float(airport['aesthetics']) if airport['aesthetics'] else 0
            
            # Simple Euclidean distance for similarity
            distance = (
                (target_cex - airport_cex) ** 2 +
                (target_comfort - airport_comfort) ** 2 +
                (target_efficiency - airport_efficiency) ** 2 +
                (target_aesthetics - airport_aesthetics) ** 2
            ) ** 0.5
            
            similarity_score = max(0, 100 - distance * 10)  # Convert to percentage
            
            airport['similarity_score'] = round(similarity_score, 2)
            similar_airports.append(airport)
        
        # Sort by similarity and return top results
        similar_airports.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        return jsonify({
            "target_airport": target,
            "similar_airports": similar_airports[:limit],
            "algorithm": "euclidean_distance"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

app.register_blueprint(cex_bp, url_prefix="/api")
app.register_blueprint(feedback_bp, url_prefix="")

if __name__ != "__main__":
    app = app
else:
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)