from flask import Blueprint, request, jsonify, current_app
from MySQLdb.cursors import DictCursor
import traceback

choose_location_bp = Blueprint('choose_location', __name__, url_prefix='/location')

@choose_location_bp.route('/search', methods=['POST'])
def handle_location_search():
    cursor = None
    try:
        data = request.get_json(force=True) or {}
        governorate = data.get("governorate")
        company_name = data.get("company")

        if not governorate or not company_name:
            return jsonify({"success": False, "error": "Governorate and company are required"}), 400

        mysql = current_app.config["MYSQL"]
        cursor = mysql.connection.cursor(DictCursor)

        
        cursor.execute("""
            SELECT pl.company_id, pl.location, pl.capacity, pl.floors
            FROM parking_locations pl
            JOIN companies c ON pl.company_id = c.id
            WHERE c.name = %s AND pl.governorate = %s
            LIMIT 1
        """, (company_name, governorate))
        parking = cursor.fetchone()

        if not parking:
            return jsonify({"success": False, "error": "Company or governorate not found"}), 404

        
        return jsonify({
            "success": True,
            "redirect_url": f"/user/choose-spot?company={company_name}&governorate={governorate}"
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()