from flask import Blueprint, request, render_template, current_app, jsonify
from MySQLdb.cursors import DictCursor
import traceback
import smtplib
from email.mime.text import MIMEText
from email.header import Header

confirm_booking_bp = Blueprint('confirm_booking', __name__, url_prefix='/user')

# ===============================
# عرض صفحة الدفع (Confirm Booking)
# ===============================
@confirm_booking_bp.route('/confirm_booking', methods=['GET'])
def confirm_booking():
    try:
        spot_id = request.args.get("spot_id")
        company = request.args.get("company")
        governorate = request.args.get("governorate")
        user_id = request.args.get("userId")   # ✅ يجي من الـ frontend
        extra_services = request.args.get("extra_services", "").split(",")
        total_cost = request.args.get("total_cost")

        return render_template(
            "confirm_booking.html",
            spot_id=spot_id,
            company=company,
            governorate=governorate,
            user_id=user_id,
            extra_services=extra_services,
            total_cost=total_cost,
            booking_time="Now"
        )
    except Exception as e:
        traceback.print_exc()
        return f"⚠️ Error loading confirm booking page: {str(e)}", 500


# ===============================
# معالجة الدفع
# ===============================
@confirm_booking_bp.route('/pay', methods=['POST'])
def pay():
    cursor = None
    try:
        spot_id = request.form.get("spot_id")
        user_id = request.form.get("user_id")   # ✅ يجي من الـ frontend
        company = request.form.get("company")
        governorate = request.form.get("governorate")
        total_cost = request.form.get("total_cost")
        payment_method = request.form.get("payment_method")
        extra_services = request.form.get("extra_services")

        mysql = current_app.config["MYSQL"]
        cursor = mysql.connection.cursor()

        # ✅ حفظ العملية في جدول payments
        cursor.execute("""
            INSERT INTO payments (user_id, spot_id, company, governorate, total_cost, payment_method, extra_services, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'success')
        """, (user_id, spot_id, company, governorate, total_cost, payment_method, extra_services))

        # ✅ حفظ الحجز في جدول reserved_spots
        cursor.execute("""
            INSERT INTO reserved_spots (user_id, spot_id, start_time, status)
            VALUES (%s, %s, NOW(), 'active')
        """, (user_id, spot_id))

        mysql.connection.commit()

        # ✅ إرسال إيميل تأكيد الدفع فقط
        send_payment_email(user_id, spot_id, total_cost, payment_method)

        return jsonify({"success": True, "redirect_url": f"/user/end_booking?spot_id={spot_id}&user_id={user_id}"})

    except Exception as e:
        if cursor:
            mysql.connection.rollback()
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)})
    finally:
        if cursor:
            cursor.close()



def send_payment_email(user_id, spot_id, total_cost, payment_method):
    cursor = current_app.config["MYSQL"].connection.cursor(DictCursor)
    cursor.execute("SELECT email FROM users WHERE id=%s", (user_id,))
    user = cursor.fetchone()
    cursor.close()

    if user and user["email"]:
        recipient = user["email"]
        subject = "Payment Confirmation - autoSpot"
        body = f"""
        Dear User,

        Your payment for spot {spot_id} has been successfully processed.
        Amount Paid: {total_cost} JOD
        Payment Method: {payment_method}

        Thank you for using autoSpot!

        Regards,
        autoSpot Team
        """

        msg = MIMEText(body, "plain", "utf-8")
        msg["Subject"] = Header(subject, "utf-8")
        msg["From"] = current_app.config["MAIL_DEFAULT_SENDER"]
        msg["To"] = recipient

        try:
            # ✅ استدعاء إعدادات الميل من config
            with smtplib.SMTP_SSL(
                current_app.config["MAIL_SERVER"],
                current_app.config["MAIL_PORT"]
            ) as server:
                server.login(
                    current_app.config["MAIL_USERNAME"],
                    current_app.config["MAIL_PASSWORD"]
                )
                server.sendmail(msg["From"], [recipient], msg.as_string())
            print(f"[INFO] Payment email sent to {recipient}")
        except Exception as e:
            print(f"[ERROR] Failed to send payment email: {e}")