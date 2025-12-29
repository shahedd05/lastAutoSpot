from flask import Blueprint, request, jsonify, current_app
from flask_mail import Message
from datetime import datetime, timedelta
import MySQLdb.cursors
import random

resend_owner_otp_bp = Blueprint('resend_owner_otp', __name__, url_prefix='/resend')

@resend_owner_otp_bp.route('/owner-otp', methods=['POST'])
def resend_owner_otp():
    cursor = None
    try:
        data = request.get_json(force=True) or {}
        register_number = (data.get('registerNumber') or '').strip()

        if not register_number:
            return jsonify({'success': False, 'error': 'Register number is required'}), 400

        mysql = current_app.config.get("MYSQL")
        mail = current_app.extensions['mail']
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)

        cursor.execute("""
            SELECT email, owner_name, register_number
            FROM pending_owners
            WHERE register_number = %s
            LIMIT 1
        """, (register_number,))
        owner = cursor.fetchone()

        
        if not owner:
            cursor.execute("""
                SELECT o.email, o.owner_name, o.register_number, c.name AS company_name
                FROM owners o
                JOIN companies c ON o.register_number = c.register_number
                WHERE o.register_number = %s
                LIMIT 1
            """, (register_number,))
            owner = cursor.fetchone()

        if not owner:
            return jsonify({'success': False, 'error': 'Account not found'}), 404

       
        otp = f"{random.randint(1000, 9999)}"
        expiry = datetime.now() + timedelta(minutes=5)

        cursor.execute("""
            UPDATE owners
            SET otp_code = %s, otp_expiry = %s, otp_verified = FALSE
            WHERE register_number = %s
        """, (otp, expiry, register_number))
        mysql.connection.commit()

        msg = Message(
            subject="Your Verification Code",
            recipients=[owner['email']],
            body=f"Hello {owner['owner_name']},\n\nYour verification code is: {otp}\nThis code expires in 1 minutes."
        )
        mail.send(msg)

        return jsonify({
            'success': True,
            'message': 'OTP sent successfully',
            'companyName': owner.get('company_name', 'Your Company'),
            'register_number': register_number
        }), 200

    except Exception as e:
        print("❌ Resend owner OTP error:", type(e).__name__, str(e))
        return jsonify({'success': False, 'error': 'Server error'}), 500

    finally:
        if cursor:
            cursor.close()