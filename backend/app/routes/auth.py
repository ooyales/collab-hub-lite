from flask import Blueprint, request, jsonify
from app import db
from app.models import User

auth_bp = Blueprint('auth', __name__)


def get_current_user():
    """Extract user from Authorization: Bearer {user_id} header."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    try:
        user_id = int(auth_header.split(' ')[1])
        return User.query.get(user_id)
    except (ValueError, IndexError):
        return None


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400

        user = User.query.filter_by(email=data['email']).first()
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401

        if not user.is_active:
            return jsonify({'error': 'Account is disabled'}), 403

        return jsonify({
            'user': user.to_dict(),
            'token': str(user.id),
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
def me():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    return jsonify(user.to_dict())


@auth_bp.route('/users', methods=['GET'])
def list_users():
    try:
        users = User.query.filter_by(is_active=True).all()
        return jsonify([u.to_dict() for u in users])
    except Exception as e:
        return jsonify({'error': str(e)}), 500
