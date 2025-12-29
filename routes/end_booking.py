from flask import Blueprint, request, render_template, jsonify, current_app
from MySQLdb.cursors import DictCursor
import traceback
import smtplib
from email.mime.text import MIMEText
from email.header import Header

end_booking_bp = Blueprint('end_booking', __name__, url_prefix='/user')

# ===============================
# عرض صفحة End Booking (GET)
# ===============================
@end_booking_bp.route('/end_booking', methods=['GET'])
def end_booking_page():
    spot_id = request.args.get("spot_id")
    user_id = request.args.get("user_id")
    return render_template("end_booking.html", spot_id=spot_id, user_id=user_id)


# ===============================
# إنهاء الحجز (POST)
# ===============================
@end_booking_bp.route('/end_booking_action', methods=['POST'])
def end_booking_action():
    cursor = None
    try:
        spot_id = request.form.get("spot_id")
        user_id = request.form.get("user_id")

        mysql = current_app.config["MYSQL"]
        cursor = mysql.connection.cursor(DictCursor)

        # ✅ جلب بيانات الحجز من جدول payments
        cursor.execute("""
            SELECT total_cost, extra_services, company, governorate
            FROM payments
            WHERE user_id=%s AND spot_id=%s AND status='success'
            LIMIT 1
        """, (user_id, spot_id))
        payment = cursor.fetchone()

        if not payment:
            return jsonify({"success": False, "error": "No active payment found."})

        total_cost = float(payment["total_cost"])
        extra_services = payment["extra_services"].split(",") if payment["extra_services"] else []
        refund_amount = total_cost - len(extra_services)  # كل خدمة إضافية = 1 JOD

        company = payment["company"]
        governorate = payment["governorate"]

        # ✅ حذف الحجز من جدول payments
        cursor.execute("DELETE FROM payments WHERE user_id=%s AND spot_id=%s", (user_id, spot_id))

        # ✅ تحديث حالة الموقف في reserved_spots ليصبح متاح
        cursor.execute("""
            UPDATE reserved_spots
            SET status='available', end_time=NOW()
            WHERE user_id=%s AND spot_id=%s AND status='active'
        """, (user_id, spot_id))

        mysql.connection.commit()

        # ✅ إرسال إيميل للمستخدم عبر Gmail SMTP
        send_cancel_email(user_id, spot_id, refund_amount, company, governorate)

        return jsonify({
            "success": True,
            "message": "Booking cancelled and refund processed.",
            "refund_amount": refund_amount,
            "spot_id": spot_id,
            "company": company,
            "governorate": governorate,
            "note": "⚠️ Extra service fees are non-refundable."
        })

    except Exception as e:
        if cursor:
            mysql.connection.rollback()
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)})
    finally:
        if cursor:
            cursor.close()


# ===============================
# دالة إرسال الإيميل باستخدام Gmail SMTP
# ===============================

def send_cancel_email(user_id, spot_id, refund_amount, company, governorate):
    cursor = current_app.config["MYSQL"].connection.cursor(DictCursor)
    cursor.execute("SELECT email FROM users WHERE id=%s", (user_id,))
    user = cursor.fetchone()
    cursor.close()

    if user and user["email"]:
        recipient = user["email"]

        subject = "Booking Cancelled (autoSpot)"
        body = f"""
        Dear User,

        Your booking for spot {spot_id} has been cancelled.
        Location: {company}, {governorate}
        Refund amount: {refund_amount} JOD

        Please note: Extra service fees are non-refundable.

        Regards,
        autoSpot Team
        """

        sender_email = current_app.config["MAIL_USERNAME"]
        sender_password = current_app.config["MAIL_PASSWORD"]

        # ✅ تأكيد الترميز UTF-8
        msg = MIMEText(body, "plain", "utf-8")
        msg["Subject"] = Header(subject, "utf-8")
        msg["From"] = sender_email
        msg["To"] = recipient

        try:
            if current_app.config.get("MAIL_USE_SSL", False):
                with smtplib.SMTP_SSL(current_app.config["MAIL_SERVER"], current_app.config["MAIL_PORT"]) as server:
                    server.login(sender_email, sender_password)
                    server.sendmail(sender_email, [recipient], msg.as_string())
            else:
                with smtplib.SMTP(current_app.config["MAIL_SERVER"], current_app.config["MAIL_PORT"]) as server:
                    if current_app.config.get("MAIL_USE_TLS", False):
                        server.starttls()
                    server.login(sender_email, sender_password)
                    server.sendmail(sender_email, [recipient], msg.as_string())

            print(f"[INFO] Cancel email sent to {recipient}")
        except Exception as e:
            print(f"[ERROR] Failed to send cancel email: {e}")


