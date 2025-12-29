from flask import Blueprint, request, jsonify, current_app
import MySQLdb.cursors
from datetime import datetime

verify_owner_login_otp_bp = Blueprint('verify_owner_login_otp', __name__, url_prefix='/verify')

@verify_owner_login_otp_bp.route('/owner-login-otp', methods=['POST'])
def verify_owner_login_otp():
    cursor = None
    try:
        data = request.get_json(force=True) or {}
        register_number = (data.get('registerNumber') or '').strip()
        otp = (data.get('otp') or '').strip()

        if not register_number or not otp:
            return jsonify({'success': False, 'error': 'Register number and OTP are required'}), 400

        mysql = current_app.config.get("MYSQL")
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)

        # ✅ البحث عن المالك والتحقق من الكود
        cursor.execute("""
            SELECT o.id, o.otp_code, o.otp_expiry, c.name AS company_name
            FROM owners o
            JOIN companies c ON o.register_number = c.register_number
            WHERE o.register_number = %s
            LIMIT 1
        """, (register_number,))
        owner = cursor.fetchone()

        if not owner:
            return jsonify({'success': False, 'error': 'Owner not found'}), 404

        if owner['otp_code'] != otp:
            return jsonify({'success': False, 'error': 'Incorrect OTP'}), 401

        if owner['otp_expiry'] and datetime.now() > owner['otp_expiry']:
            return jsonify({'success': False, 'error': 'OTP expired'}), 403

        # ✅ تحديث حالة التحقق
        cursor.execute("""
            UPDATE owners
            SET otp_verified = TRUE
            WHERE id = %s
        """, (owner['id'],))
        mysql.connection.commit()

        return jsonify({
            'success': True,
            'message': 'OTP verified successfully',
            'company_name': owner['company_name']
        }), 200

    except Exception as e:
        print("❌ Verify owner OTP error:", type(e).__name__, str(e))
        return jsonify({'success': False, 'error': 'Server error'}), 500

    finally:
        if cursor:
            cursor.close()