from flask import Blueprint, request, jsonify, current_app
import MySQLdb.cursors
from werkzeug.security import check_password_hash
from flask_mail import Message
from datetime import datetime, timedelta
import random

login_user_bp = Blueprint('login_user', __name__, url_prefix='/login')

@login_user_bp.route('/user', methods=['POST'])
def login_user():
    cursor = None
    try:
        # ✅ قراءة البيانات من الطلب
        data = request.get_json(force=True) or {}
        username = (data.get('username') or '').strip()
        password = (data.get('password') or '').strip()

        if not username or not password:
            return jsonify({'success': False, 'error': '❌ Username and password are required'}), 400

        mysql = current_app.config.get("MYSQL")
        mail = current_app.extensions['mail']
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)

        # ✅ جلب بيانات المستخدم
        cursor.execute("""
            SELECT id, username, email, password_hash
            FROM users
            WHERE username=%s
            LIMIT 1
        """, (username,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'success': False, 'error': '❌ User not found'}), 404

        # ✅ التحقق من كلمة المرور
        if not check_password_hash(user['password_hash'], password):
            return jsonify({'success': False, 'error': '❌ Incorrect password'}), 401

        # ✅ توليد OTP
        otp = f"{random.randint(1000, 9999)}"
        expiry = datetime.now() + timedelta(minutes=1)

        # ✅ تحديث جدول users بالـ OTP
        cursor.execute("""
            UPDATE users
            SET otp_code=%s, otp_expiry=%s, otp_verified=FALSE
            WHERE id=%s
        """, (otp, expiry, user['id']))
        mysql.connection.commit()

        # ✅ إرسال الإيميل
        msg = Message(
            subject="Your User Verification Code",
            recipients=[user['email']],
            body=f"Hello {user['username']},\n\nYour verification code is: {otp}\nThis code expires in 1 minutes."
        )
        msg.charset = "utf-8"
        mail.send(msg)

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

        # ✅ إرجاع بيانات + redirect للـ frontend
        return jsonify({
            'success': True,
            'message': '✅ OTP sent to user email',
            'user_id': user['id'],
            'username': user['username'],
            'redirect': redirect_page
        }), 200

    except Exception as e:
        print("❌ Login user error:", e)
        return jsonify({'success': False, 'error': '❌ Server error'}), 500

    finally:
        if cursor:
            cursor.close()