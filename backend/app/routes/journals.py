from flask import Blueprint, request, jsonify
from app import db
from app.models import Journal, IDCounter
from app.routes.auth import get_current_user
from datetime import datetime

journals_bp = Blueprint('journals', __name__)


@journals_bp.route('', methods=['GET'])
def list_journals():
    try:
        query = Journal.query

        # Filters
        entry_type = request.args.get('entry_type')
        if entry_type:
            query = query.filter(Journal.entry_type == entry_type)

        department = request.args.get('department')
        if department:
            query = query.filter(Journal.department == department)

        asset_id = request.args.get('asset_id')
        if asset_id:
            query = query.filter(Journal.asset_id == int(asset_id))

        search = request.args.get('search')
        if search:
            pattern = f'%{search}%'
            query = query.filter(
                db.or_(
                    Journal.title.ilike(pattern),
                    Journal.journal_id.ilike(pattern),
                    Journal.body.ilike(pattern),
                )
            )

        # Sort by entry_date descending by default
        sort_field = request.args.get('sort', 'entry_date')
        order = request.args.get('order', 'desc')

        sort_column = getattr(Journal, sort_field, Journal.entry_date)
        if order == 'asc':
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        journals = query.all()
        return jsonify([j.to_dict() for j in journals])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@journals_bp.route('/<int:id>', methods=['GET'])
def get_journal(id):
    try:
        journal = Journal.query.get(id)
        if not journal:
            return jsonify({'error': 'Journal entry not found'}), 404
        return jsonify(journal.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@journals_bp.route('', methods=['POST'])
def create_journal():
    try:
        data = request.get_json()
        if not data or not data.get('title'):
            return jsonify({'error': 'Title is required'}), 400

        journal_id = IDCounter.generate_id('Journals')
        current_user = get_current_user()

        journal = Journal(
            journal_id=journal_id,
            title=data['title'],
            body=data.get('body'),
            entry_type=data.get('entry_type', 'Note'),
            asset_id=data.get('asset_id'),
            related_asset_id_str=data.get('related_asset_id_str'),
            department=data.get('department'),
            author_id=current_user.id if current_user else data.get('author_id'),
        )

        if data.get('entry_date'):
            try:
                journal.entry_date = datetime.strptime(data['entry_date'], '%Y-%m-%d')
            except (ValueError, TypeError):
                pass

        db.session.add(journal)
        db.session.commit()
        return jsonify(journal.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@journals_bp.route('/<int:id>', methods=['DELETE'])
def delete_journal(id):
    try:
        journal = Journal.query.get(id)
        if not journal:
            return jsonify({'error': 'Journal entry not found'}), 404

        db.session.delete(journal)
        db.session.commit()
        return jsonify({'message': 'Journal entry deleted'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
