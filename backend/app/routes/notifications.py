from flask import Blueprint, request, jsonify
from app import db
from app.models import Notification
from app.routes.auth import get_current_user

notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route('', methods=['GET'])
def list_notifications():
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401

        query = Notification.query.filter(Notification.user_id == user.id)

        unread_only = request.args.get('unread_only', '').lower()
        if unread_only in ('true', '1', 'yes'):
            query = query.filter(Notification.is_read == False)

        query = query.order_by(Notification.created_at.desc())
        notifications = query.all()
        return jsonify([n.to_dict() for n in notifications])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@notifications_bp.route('/count', methods=['GET'])
def unread_count():
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401

        count = Notification.query.filter(
            Notification.user_id == user.id,
            Notification.is_read == False,
        ).count()

        return jsonify({'unread_count': count})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@notifications_bp.route('/<int:id>/read', methods=['PUT'])
def mark_read(id):
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401

        notification = Notification.query.get(id)
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404

        if notification.user_id != user.id:
            return jsonify({'error': 'Forbidden'}), 403

        notification.is_read = True
        db.session.commit()
        return jsonify(notification.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@notifications_bp.route('/read-all', methods=['PUT'])
def mark_all_read():
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401

        Notification.query.filter(
            Notification.user_id == user.id,
            Notification.is_read == False,
        ).update({'is_read': True})

        db.session.commit()
        return jsonify({'message': 'All notifications marked as read'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
