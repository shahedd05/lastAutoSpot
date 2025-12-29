from flask import Blueprint, request, jsonify, current_app
import traceback
from MySQLdb.cursors import DictCursor

verify_company_bp = Blueprint('verify_company', __name__, url_prefix='/owner')

@verify_company_bp.route('/verify_company', methods=['POST'])
def verify_company():
    cursor = None
    try:
        data = request.get_json(silent=True) or {}
        register_number = (data.get('registerNumber') or '').strip()
        national_number = (data.get('nationalNumber') or '').strip()

        if not register_number or not national_number:
            return jsonify({'status': 'error', 'error': 'Register number and national number are required'}), 400

        mysql = current_app.config['MYSQL']
        cursor = mysql.connection.cursor(DictCursor)

        
        cursor.execute("""
            SELECT id, name, status
            FROM companies
            WHERE register_number = %s AND national_number = %s
            LIMIT 1
        """, (register_number, national_number))
        company = cursor.fetchone()

        if not company:
            return jsonify({'status': 'not_found', 'error': 'Company not found'}), 200

        if (company.get('status') or '').lower() != 'active':
            return jsonify({
                'status': 'inactive',
                'error': 'Company is inactive',
                'companyName': company['name']
            }), 200

       
        cursor.execute("""
            SELECT id FROM owners
            WHERE register_number = %s AND national_number = %s
            LIMIT 1
        """, (register_number, national_number))
        owner = cursor.fetchone()

        if owner:
            return jsonify({
                'status': 'has_account',
                'message': 'Company verified, account exists',
                'companyName': company['name'],
                'redirect': '/login_owner'
            }), 200
        else:
            return jsonify({
                'status': 'can_register',
                'message': 'Company verified, no account found',
                'companyName': company['name'],
                'redirect': '/register_owner'
            }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'status': 'error', 'error': 'Server error: ' + str(e)}), 500

    finally:
        if cursor:
            cursor.close()
