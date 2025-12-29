from flask import Blueprint, jsonify, current_app, request
from MySQLdb.cursors import DictCursor
import traceback

booking_records_bp = Blueprint('booking_records', __name__, url_prefix='')

@booking_records_bp.route('/booking_records', methods=['GET'])
def get_spot_records():
    cursor = None
    try:
        mysql = current_app.config["MYSQL"]
        cursor = mysql.connection.cursor(DictCursor)

        user_id = request.args.get("user_id")
        status = request.args.get("status")
        from_date = request.args.get("from_date")
        to_date = request.args.get("to_date")

        sql = """
            SELECT rs.id, u.username, rs.spot_id, rs.start_time, rs.end_time, rs.status
            FROM reserved_spots rs
            JOIN users u ON rs.user_id = u.id
            WHERE 1=1
        """
        params = []

        if user_id:
            sql += " AND rs.user_id = %s"
            params.append(user_id)

        if status:
            sql += " AND rs.status = %s"
            params.append(status)

        if from_date:
            sql += " AND rs.start_time >= %s"
            params.append(from_date)

        if to_date:
            sql += " AND rs.end_time <= %s"
            params.append(to_date)

        sql += " ORDER BY rs.start_time DESC"

        cursor.execute(sql, tuple(params))
        records = cursor.fetchall()

        if not records:
            return jsonify({"success": False, "error": "No spot records found"}), 404

        data = []
        for rec in records:
            data.append({
                "id": rec["id"],
                "username": rec["username"],
                "spot_id": rec["spot_id"],
                "start_time": rec["start_time"].strftime("%Y-%m-%d %H:%M") if rec["start_time"] else None,
                "end_time": rec["end_time"].strftime("%Y-%m-%d %H:%M") if rec["end_time"] else None,
                "status": rec["status"]
            })

        return jsonify({"success": True, "records": data}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()