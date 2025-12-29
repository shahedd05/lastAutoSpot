from flask import Flask, render_template, Blueprint
from flask_cors import CORS
from flask_mail import Mail
from db import init_db

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app, supports_credentials=True)

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USE_SSL'] = True
app.config['MAIL_USERNAME'] = 'autospot.system@gmail.com'        
app.config['MAIL_PASSWORD'] = 'kyhg hpdq xaty yevs'                 
app.config['MAIL_DEFAULT_SENDER'] = 'autospot.system@gmail.com'


mail = Mail(app)
app.extensions['mail'] = mail


app.config['MYSQL_CURSORCLASS'] = 'DictCursor'
mysql = init_db(app)
app.config["MYSQL"] = mysql

from routes.register_user import register_user_bp
from routes.verify_otp import verify_otp_bp
from routes.login_user import login_user_bp
from routes.reset_password import reset_user_bp
from routes.verify_company import verify_company_bp
from routes.register_owner import register_owner_bp
from routes.login_owner import login_owner_bp
from routes.verify_owner_otp import verify_owner_otp_bp
from routes.reset_password_owner import reset_owner_bp
from routes.verify_owner_login_otp import verify_owner_login_otp_bp
from routes.resend_otp import resend_bp
from routes.index import index_bp
from routes.verify_login_otp import verify_login_otp_bp
from routes.resend_login_otp import resend_login_otp_bp
from routes.parking_setup import parking_setup_bp
from routes.resend_owner_otp import resend_owner_otp_bp
from routes.choose_location import choose_location_bp
from routes.choose_spot import choose_spot_bp
from routes.confirm_booking import confirm_booking_bp
from routes.end_booking import end_booking_bp  
from routes.booking_records import booking_records_bp


app.register_blueprint(register_user_bp)
app.register_blueprint(verify_otp_bp)
app.register_blueprint(resend_bp)
app.register_blueprint(login_user_bp)
app.register_blueprint(reset_user_bp)
app.register_blueprint(verify_company_bp)
app.register_blueprint(register_owner_bp)
app.register_blueprint(resend_owner_otp_bp)
app.register_blueprint(login_owner_bp)
app.register_blueprint(verify_owner_otp_bp)
app.register_blueprint(reset_owner_bp)
app.register_blueprint(verify_owner_login_otp_bp)
app.register_blueprint(index_bp)
app.register_blueprint(verify_login_otp_bp)
app.register_blueprint(resend_login_otp_bp)
app.register_blueprint(parking_setup_bp)
app.register_blueprint(choose_location_bp)
app.register_blueprint(choose_spot_bp)
app.register_blueprint(confirm_booking_bp)
app.register_blueprint(end_booking_bp)
app.register_blueprint(booking_records_bp)


pages_bp = Blueprint('pages', __name__)

@pages_bp.route('/register_user')
def register_user_page():
    return render_template('register_user.html')

@pages_bp.route('/login_user')
def login_user_page():
    return render_template('login_user.html')

@pages_bp.route('/login_owner')
def login_owner_page():
    return render_template('login_owner.html')

@pages_bp.route('/reset_password')
def reset_password_page():
    return render_template('reset_password.html')

@pages_bp.route('/reset_password_owner')
def reset_password_owner_page():
    return render_template('reset_password_owner.html')

@pages_bp.route('/verify_company')
def verify_company_page():
    return render_template('verify_company.html')

@pages_bp.route('/register_owner')
def register_owner_page():
    return render_template('register_owner.html')

@pages_bp.route('/parking_setup')
def parking_setup_page():
    return render_template('parking_setup.html')

@pages_bp.route('/choose_location')
def choose_location_page():
    return render_template('choose_location.html')

@pages_bp.route('/choose_spot')
def choose_spot_page():
    return render_template('choose_spot.html')

@pages_bp.route('/payment')
def payment_page():
    return render_template('confirm_booking.html')


@pages_bp.route('/end_booking_page')
def end_booking_page():
    return render_template('end_booking.html')

@app.route('/booking-records')
def booking_records_page():
    return render_template('booking_records.html')


app.register_blueprint(pages_bp)

if __name__ == '__main__':
    app.run(debug=True)