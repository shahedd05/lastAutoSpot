from flask import Blueprint, request, jsonify, current_app
import MySQLdb.cursors
from werkzeug.security import check_password_hash
from flask_mail import Message
from datetime import datetime, timedelta
import random

login_owner_bp = Blueprint('login_owner', __name__, url_prefix='/login')

@login_owner_bp.route('/owner', methods=['POST'])
def login_owner():
    cursor = None
    try:
        data = request.get_json(force=True) or {}
        register_number = (data.get('registerNumber') or '').strip()
        password = (data.get('password') or '').strip()

        if not register_number or not password:
            return jsonify({'success': False, 'error': 'Register number and password are required'}), 400

        mysql = current_app.config.get("MYSQL")
        mail = current_app.extensions['mail']
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)

        # ✅ جلب بيانات المالك + الشركة عبر register_number
        cursor.execute("""
            SELECT 
                o.id AS owner_id,
                o.owner_name,
                o.email,
                o.password_hash,
                c.id AS company_id,
                c.name AS company_name
            FROM owners o
            JOIN companies c 
                ON o.register_number = c.register_number
            WHERE o.register_number=%s
            LIMIT 1
        """, (register_number,))
        
        owner = cursor.fetchone()

        if not owner:
            return jsonify({'success': False, 'error': 'Owner not found'}), 404

        # ✅ التحقق من كلمة المرور
        if not check_password_hash(owner['password_hash'], password):
            return jsonify({'success': False, 'error': 'Incorrect password'}), 401

        # ✅ توليد OTP
        otp = f"{random.randint(1000, 9999)}"
        expiry = datetime.now() + timedelta(minutes=1)

        cursor.execute("""
            UPDATE owners
            SET otp_code=%s, otp_expiry=%s, otp_verified=FALSE
            WHERE id=%s
        """, (otp, expiry, owner['owner_id']))
        mysql.connection.commit()

        # ✅ إرسال الإيميل
        msg = Message(
            subject="Your Owner Verification Code",
            sender=current_app.config['MAIL_DEFAULT_SENDER'],
            recipients=[owner['email']],
            body=f"Hello {owner['owner_name']},\n\nYour verification code is: {otp}\nThis code expires in 1 minutes."
        )
        mail.send(msg)

        # ✅ إرجاع بيانات الشركة + redirect للـ frontend
        return jsonify({
            'success': True,
            'message': 'OTP sent to owner email',
            'owner_id': owner['owner_id'],
            'company_id': owner['company_id'],
            'company_name': owner['company_name'],
            'register_number': register_number,
            'redirect': '/verify_owner_otp'   # صفحة إدخال OTP
        }), 200

    except Exception as e:
        print("❌ Login owner error:", e)
        return jsonify({'success': False, 'error': 'Server error'}), 500

    finally:
        if cursor:
            cursor.close()