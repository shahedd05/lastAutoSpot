from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash
import MySQLdb.cursors

reset_user_bp = Blueprint('reset_user', __name__, url_prefix='/reset')

@reset_user_bp.route('/user', methods=['POST'])
def reset_user_password():
    cursor = None
    try:
        data = request.get_json(force=True) or {}
        username = (data.get('username') or '').strip()
        new_password = (data.get('newPassword') or '').strip()
        confirm_password = (data.get('confirmPassword') or '').strip()

        # ✅ تحقق من الحقول
        if not username or not new_password or not confirm_password:
            return jsonify({'success': False, 'error': 'All fields are required'}), 400

        if new_password != confirm_password:
            return jsonify({'success': False, 'error': 'Passwords do not match'}), 400

        mysql = current_app.config.get("MYSQL")
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)

        # ✅ تحقق من وجود المستخدم
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        # ✅ تحديث كلمة المرور
        hashed_password = generate_password_hash(new_password)
        cursor.execute("""
            UPDATE users
            SET password_hash = %s, otp_verified = FALSE
            WHERE id = %s
        """, (hashed_password, user['id']))
        mysql.connection.commit()

        return jsonify({
            'success': True,
            'message': 'Password updated successfully',
            'redirect': '/login_user'   # يرجع المستخدم لصفحة تسجيل الدخول
        }), 200

    except Exception as e:
        print("❌ Reset user password error:", type(e).__name__, str(e))
        return jsonify({'success': False, 'error': 'Server error'}), 500

    finally:
        if cursor:
            cursor.close()