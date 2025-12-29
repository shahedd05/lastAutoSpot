from flask import Blueprint, request, jsonify, current_app
import MySQLdb.cursors
from datetime import datetime

verify_login_otp_bp = Blueprint('verify_login_otp', __name__, url_prefix='/verify')

@verify_login_otp_bp.route('/login_otp', methods=['POST'])
def verify_login_otp():
    mysql = current_app.config.get("MYSQL")
    if not mysql:
        return jsonify({'success': False, 'error': 'Database connection not initialized'}), 500

    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    data = request.get_json(silent=True) or {}

    username = (data.get('username') or '').strip()
    otp = (data.get('otp') or '').strip()

    if not username or not otp:
        cursor.close()
        return jsonify({'success': False, 'error': 'Username and OTP are required'}), 400

    # ✅ البحث عن المستخدم في جدول users
    cursor.execute("SELECT * FROM users WHERE username=%s LIMIT 1", (username,))
    user = cursor.fetchone()

    if not user:
        cursor.close()
        return jsonify({'success': False, 'error': 'User not found'}), 404

    # ✅ التحقق من صحة الـ OTP
    if otp != user['otp_code']:
        cursor.close()
        return jsonify({'success': False, 'error': 'Invalid OTP'}), 400

    # ✅ التحقق من انتهاء صلاحية OTP
    if datetime.now() > user['otp_expiry']:
        cursor.close()
        return jsonify({'success': False, 'error': 'OTP expired'}), 400

    try:
        # ✅ تحديث حالة التحقق
        cursor.execute("""
            UPDATE users
            SET otp_verified = TRUE
            WHERE id=%s
        """, (user['id'],))
        mysql.connection.commit()

        # ✅ تحقق إذا عنده حجز نشط
        cursor.execute("""
            SELECT spot_id
            FROM payments
            WHERE user_id = %s AND status = 'success'
            LIMIT 1
        """, (user['id'],))
        booking = cursor.fetchone()

        if booking:
            spot_id = booking["spot_id"]
            redirect_page = f"/user/end_booking?spot_id={spot_id}&user_id={user['id']}"
        else:
            redirect_page = "/choose_location"

        return jsonify({
    'success': True,
    'message': 'Login verified successfully.',
    'user_id': user['id'],          # ✅ إضافة user_id
    'username': user['username'],   # ✅ إضافة username
    'redirect': redirect_page
}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

    finally:
        cursor.close()