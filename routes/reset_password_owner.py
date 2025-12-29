from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash
import MySQLdb.cursors

reset_owner_bp = Blueprint('reset_owner', __name__, url_prefix='/reset')

@reset_owner_bp.route('/owner', methods=['POST'])
def reset_owner_password():
    cursor = None
    try:
        data = request.get_json(force=True) or {}
        register_number = (data.get('registerNumber') or '').strip()
        new_password = (data.get('newPassword') or '').strip()
        confirm_password = (data.get('confirmPassword') or '').strip()

        # ✅ تحقق من الحقول
        if not register_number or not new_password or not confirm_password:
            return jsonify({'success': False, 'error': 'All fields are required'}), 400

        if new_password != confirm_password:
            return jsonify({'success': False, 'error': 'Passwords do not match'}), 400

        mysql = current_app.config.get("MYSQL")
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)

        # ✅ تحقق من وجود المالك
        cursor.execute("SELECT id FROM owners WHERE register_number = %s", (register_number,))
        owner = cursor.fetchone()

        if not owner:
            return jsonify({'success': False, 'error': 'Owner not found'}), 404

        # ✅ تحديث كلمة المرور
        hashed_password = generate_password_hash(new_password)
        cursor.execute("""
            UPDATE owners
            SET password_hash = %s, otp_verified = FALSE
            WHERE id = %s
        """, (hashed_password, owner['id']))
        mysql.connection.commit()

        return jsonify({
            'success': True,
            'message': 'Password updated successfully',
            'redirect': '/login_owner'
        }), 200

    except Exception as e:
        print("❌ Reset owner password error:", type(e).__name__, str(e))
        return jsonify({'success': False, 'error': 'Server error'}), 500

    finally:
        if cursor:
            cursor.close()