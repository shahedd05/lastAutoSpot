from flask import Blueprint, request, jsonify, current_app
from MySQLdb.cursors import DictCursor
from datetime import datetime
import traceback

verify_owner_otp_bp = Blueprint('verify_owner_otp', __name__, url_prefix='/verify')

@verify_owner_otp_bp.route('/owner-otp', methods=['POST'])
def verify_owner_otp():
    cursor = None
    try:
        data = request.get_json(force=True) or {}
        register_number = (data.get('registerNumber') or '').strip()
        otp = (data.get('otp') or '').strip()

        if not register_number or not otp:
            return jsonify({'success': False, 'error': 'Register number and OTP are required'}), 400

        mysql = current_app.config['MYSQL']
        cursor = mysql.connection.cursor(DictCursor)

        # ✅ البحث عن الحساب في pending_owners
        cursor.execute("""
            SELECT id, register_number, national_number, owner_name, email,
                   password_hash, otp_code, otp_expiry
            FROM pending_owners
            WHERE register_number=%s
            LIMIT 1
        """, (register_number,))
        pending_owner = cursor.fetchone()

        if not pending_owner:
            return jsonify({'success': False, 'error': 'Pending account not found'}), 404

        # ✅ التحقق من صحة الـ OTP
        if otp != str(pending_owner['otp_code']):
            return jsonify({'success': False, 'error': 'Invalid OTP'}), 401

        # ✅ التحقق من انتهاء صلاحية الـ OTP
        if pending_owner['otp_expiry'] and datetime.now() > pending_owner['otp_expiry']:
            return jsonify({'success': False, 'error': 'OTP expired'}), 401

        # ✅ نقل الحساب من pending_owners → owners
        cursor.execute("""
            INSERT INTO owners (register_number, national_number, owner_name, email, password_hash, created_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
        """, (
            pending_owner['register_number'],
            pending_owner['national_number'],
            pending_owner['owner_name'],
            pending_owner['email'],
            pending_owner['password_hash']
        ))

        # ✅ حذف الحساب من pending_owners
        cursor.execute("DELETE FROM pending_owners WHERE id=%s", (pending_owner['id'],))
        mysql.connection.commit()

        return jsonify({
            'success': True,
            'message': 'Account activated successfully'
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'Server error: ' + str(e)}), 500

    finally:
        if cursor:
            cursor.close()