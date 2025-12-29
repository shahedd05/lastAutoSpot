from flask import Blueprint, request, jsonify, current_app
import MySQLdb.cursors
from datetime import datetime, timedelta
from flask_mail import Message
import random

resend_login_otp_bp = Blueprint('resend_login_otp', __name__, url_prefix='/resend')

@resend_login_otp_bp.route('/login_otp', methods=['POST'])
def resend_login_otp():
    cursor = None
    try:
        data = request.get_json(silent=True) or {}
        username = (data.get('username') or '').strip()

        if not username:
            return jsonify({'success': False, 'error': 'Username is required'}), 400

        mysql = current_app.config["MYSQL"]
        mail = current_app.extensions.get("mail")
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)

        
        cursor.execute("SELECT * FROM users WHERE username=%s", (username,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        
        otp = f"{random.randint(1000, 9999)}"
        expiry = datetime.now() + timedelta(minutes=1)

        
        cursor.execute("""
            UPDATE users
            SET otp_code=%s, otp_expiry=%s, otp_verified=FALSE
            WHERE id=%s
        """, (otp, expiry, user['id']))
        mysql.connection.commit()

       
        msg = Message(
            subject="Your AutoSpot Login Code",
            recipients=[user['email']],
            body=f"Your new login verification code is: {otp}"
        )
        mail.send(msg)

        return jsonify({'success': True, 'message': 'Login OTP resent successfully'}), 200

    except Exception as e:
        print("❌ Resend login OTP error:", str(e))
        return jsonify({'success': False, 'error': 'Server error'}), 500

    finally:
        if cursor:
            cursor.close()