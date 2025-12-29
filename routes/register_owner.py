from flask import Blueprint, request, jsonify, current_app
from MySQLdb.cursors import DictCursor
from werkzeug.security import generate_password_hash
from flask_mail import Message
from datetime import datetime, timedelta
import random, traceback

register_owner_bp = Blueprint('register_owner', __name__)

@register_owner_bp.route('/register_owner', methods=['POST'])
def register_owner():
    cursor = None
    try:
        data = request.get_json(force=True) or {}
        reg = (data.get('registerNumber') or '').strip()
        nat = (data.get('nationalNumber') or '').strip()
        owner_name = (data.get('ownerName') or '').strip()
        email = (data.get('email') or '').strip()
        password = (data.get('password') or '').strip()

        if not reg or not nat or not owner_name or not email or not password:
            return jsonify({'error': 'All fields are required'}), 400

        mysql = current_app.config['MYSQL']
        cursor = mysql.connection.cursor(DictCursor)

        # ✅ هل الحساب موجود مسبقًا في owners؟
        cursor.execute("""
            SELECT id FROM owners WHERE register_number=%s AND national_number=%s
        """, (reg, nat))
        if cursor.fetchone():
            return jsonify({
                'error': 'Account already exists. Please login.',
                'redirect': '/login_owner'
            }), 409

        # ✅ هل الحساب موجود مسبقًا في pending_owners؟
        cursor.execute("""
            SELECT id FROM pending_owners WHERE register_number=%s AND national_number=%s
        """, (reg, nat))
        pending = cursor.fetchone()
        if pending:
            return jsonify({
                'error': 'Account is pending verification. Please enter the OTP to activate your account.',
                'redirect': '/otp'
            }), 409

        # ✅ توليد OTP
        otp = str(random.randint(1000, 9999))
        expiry = datetime.now() + timedelta(minutes=1)

        hashed_pw = generate_password_hash(password)

        # ✅ إدخال الحساب في pending_owners
        cursor.execute("""
            INSERT INTO pending_owners 
            (register_number, national_number, owner_name, email, password_hash, otp_code, otp_expiry)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (reg, nat, owner_name, email, hashed_pw, otp, expiry))
        mysql.connection.commit()

        # ✅ الحصول على mail من current_app
        mail = current_app.extensions['mail']

        # ✅ إرسال الإيميل
        msg = Message(
            subject="Owner Account Verification Code",
            recipients=[email],
            body=f"Hello {owner_name},\n\nYour verification code is: {otp}\nThis code expires in 1 minutes."
        )
        mail.send(msg)

        return jsonify({
            'success': True,
            'ownerName': owner_name,
            'message': 'OTP sent successfully'
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': 'Server error: ' + str(e)}), 500

    finally:
        if cursor:
            cursor.close()