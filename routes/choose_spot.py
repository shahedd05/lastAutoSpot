from flask import Blueprint, request, render_template, current_app
from MySQLdb.cursors import DictCursor
import traceback

choose_spot_bp = Blueprint('choose_spot', __name__, url_prefix='/user')


@choose_spot_bp.route('/choose-spot', methods=['GET'])
def choose_spot():
    cursor = None
    try:
        company_name = request.args.get("company")
        governorate = request.args.get("governorate")

         
        if not company_name or not governorate:
            return render_template(
                "choose_spot.html",
                company=None,
                governorate=None,
                spots={},
                services=[],
                message="⚠️ Please select company and governorate first."
            )

        mysql = current_app.config["MYSQL"]
        cursor = mysql.connection.cursor(DictCursor)

        # ✅ جلب إعدادات المصف
        cursor.execute("""
            SELECT pl.id, pl.location, pl.capacity, pl.floors
            FROM parking_locations pl
            JOIN companies c ON pl.company_id = c.id
            WHERE c.name = %s AND pl.governorate = %s
            LIMIT 1
        """, (company_name, governorate))
        parking = cursor.fetchone()

        if not parking:
            return render_template(
                "choose_spot.html",
                company=company_name,
                governorate=governorate,
                spots={},
                services=[],
                message="⚠️ Parking setup not found."
            )

        floors = int(parking["floors"])
        capacity = int(parking["capacity"])

        # ✅ جلب المواقف المحجوزة من جدول payments
        cursor.execute("""
            SELECT spot_id
            FROM payments
            WHERE company = %s AND governorate = %s AND status = 'success'
        """, (company_name, governorate))
        paid_spots = {row["spot_id"] for row in cursor.fetchall()}

        # ✅ جلب المواقف المحجوزة من جدول reserved_spots
        cursor.execute("""
            SELECT spot_id
            FROM reserved_spots
            WHERE status = 'active'
        """)
        reserved_spots = {row["spot_id"] for row in cursor.fetchall()}

        # ✅ دمج المواقف المحجوزة من الجدولين
        all_taken_spots = paid_spots.union(reserved_spots)

        # ✅ بناء شبكة المواقف
        parking_structure = {}
        for f in range(1, floors + 1):
            floor_spots = []
            for s in range(1, capacity + 1):
                spot_id = f"{chr(64+f)}-{s}"
                is_available = spot_id not in all_taken_spots
                floor_spots.append({
                    "id": spot_id,
                    "available": is_available
                })
            parking_structure[f] = floor_spots

        # ✅ جلب الخدمات الإضافية
        cursor.execute("""
            SELECT ev_charging, security_cameras, valet_service
            FROM parking_services
            WHERE parking_id = %s
            LIMIT 1
        """, (parking["id"],))
        services = cursor.fetchone()

        available_services = []
        if services:
            if services.get("ev_charging"):
                available_services.append("EV Charging")
            if services.get("security_cameras"):
                available_services.append("Security Cameras")
            if services.get("valet_service"):
                available_services.append("Valet Service")

        # ✅ إرسال البيانات للواجهة choose_spot.html
        return render_template(
            "choose_spot.html",
            company=parking["location"],
            governorate=governorate,
            spots=parking_structure,
            services=available_services,
            message=None
        )

    except Exception as e:
        traceback.print_exc()
        return render_template(
            "choose_spot.html",
            company=None,
            governorate=None,
            spots={},
            services=[],
            message=f"⚠️ Error: {str(e)}"
        )
    finally:
        if cursor:
            cursor.close()