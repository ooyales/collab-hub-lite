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
    """Authenticate and get a token.
    ---
    tags:
      - Auth
    security: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - email
            - password
          properties:
            email:
              type: string
              example: admin@collabhub.local
            password:
              type: string
              example: demo123
    responses:
      200:
        description: Login successful
        schema:
          type: object
          properties:
            user:
              $ref: '#/definitions/User'
            token:
              type: string
              description: User ID used as Bearer token
      400:
        description: Missing credentials
      401:
        description: Invalid credentials
      403:
        description: Account disabled
    """
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
    """Get current authenticated user.
    ---
    tags:
      - Auth
    responses:
      200:
        description: Current user profile
        schema:
          $ref: '#/definitions/User'
      401:
        description: Unauthorized
    """
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    return jsonify(user.to_dict())


@auth_bp.route('/users', methods=['GET'])
def list_users():
    """List all active users.
    ---
    tags:
      - Auth
    security: []
    responses:
      200:
        description: List of active users
        schema:
          type: array
          items:
            $ref: '#/definitions/User'
    """
    try:
        users = User.query.filter_by(is_active=True).all()
        return jsonify([u.to_dict() for u in users])
    except Exception as e:
        return jsonify({'error': str(e)}), 500
