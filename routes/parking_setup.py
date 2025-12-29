from flask import Blueprint, request, jsonify, current_app
from MySQLdb.cursors import DictCursor
import traceback

parking_setup_bp = Blueprint('parking_setup', __name__, url_prefix='/parking')

# ===============================
# حفظ أو تحديث بيانات الموقف والخدمات
# ===============================
@parking_setup_bp.route('/setup', methods=['POST'])
def save_or_update_parking_with_services():
    cursor = None
    try:
        data = request.get_json(force=True) or {}

        owner_id = data.get("ownerId")
        company_id = data.get("companyId")
        register_number = data.get("registerNumber")
        country = "Jordan"  # ✅ ثابتة ولا تُعدل
        governorate = data.get("governorate")
        location = data.get("location")
        capacity = data.get("capacity")
        floors = data.get("floors")

        ev = bool(data.get("ev", False))
        camera = bool(data.get("camera", False))
        valet = bool(data.get("valet", False))

        if not owner_id or not company_id or not register_number or not governorate or not location:
            return jsonify({"success": False, "error": "Missing required fields"}), 400

        mysql = current_app.config["MYSQL"]
        cursor = mysql.connection.cursor(DictCursor)

        # تحقق إذا فيه موقف محفوظ مسبقًا لنفس الشركة
        cursor.execute("""
            SELECT id FROM parking_locations
            WHERE company_id = %s
            LIMIT 1
        """, (company_id,))
        existing = cursor.fetchone()

        if existing:
            parking_id = existing["id"]

            # تحديث بيانات الموقف (اسم الشركة والبلد لا تُعدل)
            cursor.execute("""
                UPDATE parking_locations
                SET owner_id=%s, governorate=%s, location=%s, capacity=%s, floors=%s
                WHERE id=%s
            """, (owner_id, governorate, location, capacity, floors, parking_id))

            # تحديث أو إدخال الخدمات
            cursor.execute("SELECT parking_id FROM parking_services WHERE parking_id=%s", (parking_id,))
            if cursor.fetchone():
                cursor.execute("""
                    UPDATE parking_services
                    SET ev_charging=%s, security_cameras=%s, valet_service=%s
                    WHERE parking_id=%s
                """, (ev, camera, valet, parking_id))
            else:
                cursor.execute("""
                    INSERT INTO parking_services (parking_id, ev_charging, security_cameras, valet_service)
                    VALUES (%s, %s, %s, %s)
                """, (parking_id, ev, camera, valet))

            message = "Parking setup updated successfully"

        else:
            # إدخال جديد
            cursor.execute("""
                INSERT INTO parking_locations 
                (owner_id, company_id, register_number, country, governorate, location, capacity, floors)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (owner_id, company_id, register_number, country, governorate, location, capacity, floors))

            parking_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO parking_services 
                (parking_id, ev_charging, security_cameras, valet_service)
                VALUES (%s, %s, %s, %s)
            """, (parking_id, ev, camera, valet))

            message = "Parking setup and services saved successfully"

        mysql.connection.commit()
        return jsonify({"success": True, "message": message}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": "Server error: " + str(e)}), 500

    finally:
        if cursor:
            cursor.close()

# ===============================
# جلب بيانات الموقف حسب register_number
# ===============================
@parking_setup_bp.route('/setup-data', methods=['GET'])
def get_parking_data():
    cursor = None
    try:
        register_number = request.args.get("registerNumber")

        if not register_number:
            return jsonify({"success": False, "error": "Missing register number"}), 400

        mysql = current_app.config["MYSQL"]
        cursor = mysql.connection.cursor(DictCursor)

        # جلب بيانات الشركة
        cursor.execute("""
            SELECT id, name
            FROM companies
            WHERE register_number = %s
            LIMIT 1
        """, (register_number,))
        company = cursor.fetchone()

        if not company:
            return jsonify({"success": False, "error": "Company not found"}), 404

        company_id = company["id"]
        company_name = company["name"]

        # جلب بيانات الموقف والخدمات
        cursor.execute("""
            SELECT pl.governorate, pl.location, pl.capacity, pl.floors,
                   COALESCE(ps.ev_charging, 0) as ev_charging,
                   COALESCE(ps.security_cameras, 0) as security_cameras,
                   COALESCE(ps.valet_service, 0) as valet_service
            FROM parking_locations pl
            LEFT JOIN parking_services ps ON pl.id = ps.parking_id
            WHERE pl.company_id = %s
            LIMIT 1
        """, (company_id,))
        parking = cursor.fetchone()

        data = {
            "company_name": company_name,
            "country": "Jordan",
            "governorate": parking["governorate"] if parking else "",
            "location": parking["location"] if parking else "",
            "capacity": parking["capacity"] if parking else "",
            "floors": parking["floors"] if parking else "",
            "ev_charging": parking["ev_charging"] if parking else 0,
            "security_cameras": parking["security_cameras"] if parking else 0,
            "valet_service": parking["valet_service"] if parking else 0
        }

        return jsonify({"success": True, "data": data}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()