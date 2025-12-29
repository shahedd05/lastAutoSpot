from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
from flask_mail import Message
import random
import re

register_user_bp = Blueprint('register_user', __name__, url_prefix='/register')

@register_user_bp.route('/user', methods=['POST'])
def register_user():
    mysql = current_app.config.get("MYSQL")
    mail = current_app.extensions.get("mail")  # ✅ جلب إعدادات الإيميل

    if not mysql:
        return jsonify({'error': 'Database connection not initialized'}), 500

    cursor = mysql.connection.cursor()
    data = request.get_json(silent=True) or {}

    username = (data.get('username') or '').strip()
    email = (data.get('email') or '').strip()
    password = (data.get('password') or '').strip()
    confirm = (data.get('confirm') or '').strip()

   
    if not all([username, email, password, confirm]):
        return jsonify({'error': 'All fields are required'}), 400

    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({'error': 'Invalid email format'}), 400

    if password != confirm:
        return jsonify({'error': 'Passwords do not match'}), 400

    
    cursor.execute("SELECT id FROM users WHERE username=%s LIMIT 1", (username,))
    if cursor.fetchone():
        return jsonify({'error': 'Username already exists'}), 400

    cursor.execute("SELECT id FROM pending_users WHERE username=%s LIMIT 1", (username,))
    if cursor.fetchone():
        return jsonify({'error': 'Username already pending verification'}), 400

    
    cursor.execute("SELECT COUNT(*) AS cnt FROM users WHERE email=%s", (email,))
    user_count = cursor.fetchone()['cnt']

    cursor.execute("SELECT COUNT(*) AS cnt FROM pending_users WHERE email=%s", (email,))
    pending_count = cursor.fetchone()['cnt']

    if (user_count + pending_count) >= 1:
        return jsonify({'error': 'Email already used for an account'}), 400

   
    hashed_password = generate_password_hash(password)
    otp = str(random.randint(1000, 9999))  
    otp_expiry = datetime.now() + timedelta(minutes=1)

    try:
        cursor.execute("""
            INSERT INTO pending_users (username, email, password_hash, otp_code, otp_expiry, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (username, email, hashed_password, otp, otp_expiry, datetime.now()))
        mysql.connection.commit()

        try:
            msg = Message(
                subject="Your AutoSpot Verification Code",
                recipients=[email],
                body=f"Your verification code is: {otp}"
            )
            mail.send(msg)
        except Exception as mail_error:
            print("Email sending failed:", mail_error)

        return jsonify({
            'success': True,
            'message': 'Account created successfully. Please verify OTP to activate.',
            'redirect': '/verify_otp'
        }), 201

    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({'error': str(e)}), 500

    finally:
        cursor.close()