from flask import Blueprint, render_template


index_bp = Blueprint('index', __name__, template_folder='templates', static_folder='static')

@index_bp.route('/index')  
def index():
   
    return render_template('index.html')
