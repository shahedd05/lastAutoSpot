from flask import Blueprint, request, jsonify, current_app
import MySQLdb.cursors
from datetime import datetime, timedelta
from flask_mail import Message
import random

resend_bp = Blueprint('resend', __name__, url_prefix='/resend')

@resend_bp.route('/otp', methods=['POST'])
def resend_otp():
    cursor = None
    try:
        data = request.get_json(silent=True) or {}
        username = (data.get('username') or '').strip()

        if not username:
            return jsonify({'success': False, 'error': 'Username is required'}), 400

        mysql = current_app.config["MYSQL"]
        mail = current_app.extensions.get("mail")
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)

        
        cursor.execute("SELECT * FROM pending_users WHERE username=%s", (username,))
        pending_user = cursor.fetchone()

        if not pending_user:
            return jsonify({'success': False, 'error': 'User not found or already verified'}), 404

        
        otp = f"{random.randint(1000, 9999)}"
        expiry = datetime.now() + timedelta(minutes=5)

        
        cursor.execute("""
            UPDATE pending_users 
            SET otp_code=%s, otp_expiry=%s 
            WHERE id=%s
        """, (otp, expiry, pending_user['id']))
        mysql.connection.commit()

      
        try:
            msg = Message(
                subject="Your New AutoSpot Verification Code",
                recipients=[pending_user['email']],
                body=f"Your new verification code is: {otp}"
            )
            mail.send(msg)
        except Exception as mail_error:
            print("Email sending failed:", mail_error)
            return jsonify({'success': False, 'error': 'Failed to send email'}), 500

        return jsonify({'success': True, 'message': 'OTP resent successfully'}), 200

    except Exception as e:
        print("❌ Resend OTP error:", type(e).__name__, str(e))
        return jsonify({'success': False, 'error': 'Server error. Please try again later.'}), 500

    finally:
        if cursor:
            cursor.close()