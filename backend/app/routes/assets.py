from flask import Blueprint, request, jsonify
from app import db
from app.models import Asset, Task, Journal, Document, IDCounter
from datetime import date, datetime

assets_bp = Blueprint('assets', __name__)


@assets_bp.route('', methods=['GET'])
def list_assets():
    """List all assets with optional filters.
    ---
    tags:
      - Assets
    parameters:
      - name: status
        in: query
        type: string
        required: false
        enum: [Active, Pending Renewal, Expired, Retired]
      - name: department
        in: query
        type: string
        required: false
      - name: asset_type
        in: query
        type: string
        required: false
        enum: [Hardware, Software, Contract, Project]
      - name: search
        in: query
        type: string
        required: false
        description: Search across title, asset_id, vendor, contract_number, description
      - name: sort
        in: query
        type: string
        required: false
        default: created_at
        description: Field to sort by
      - name: order
        in: query
        type: string
        required: false
        default: desc
        enum: [asc, desc]
    responses:
      200:
        description: List of assets
        schema:
          type: array
          items:
            $ref: '#/definitions/Asset'
    """
    try:
        query = Asset.query

        # Filters
        status = request.args.get('status')
        if status:
            query = query.filter(Asset.status == status)

        department = request.args.get('department')
        if department:
            query = query.filter(Asset.department == department)

        asset_type = request.args.get('asset_type')
        if asset_type:
            query = query.filter(Asset.asset_type == asset_type)

        search = request.args.get('search')
        if search:
            pattern = f'%{search}%'
            query = query.filter(
                db.or_(
                    Asset.title.ilike(pattern),
                    Asset.asset_id.ilike(pattern),
                    Asset.vendor.ilike(pattern),
                    Asset.contract_number.ilike(pattern),
                    Asset.description.ilike(pattern),
                )
            )

        # Sorting
        sort_field = request.args.get('sort', 'created_at')
        order = request.args.get('order', 'desc')

        sort_column = getattr(Asset, sort_field, Asset.created_at)
        if order == 'asc':
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        assets = query.all()
        return jsonify([a.to_dict() for a in assets])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@assets_bp.route('/<int:id>', methods=['GET'])
def get_asset(id):
    """Get a single asset by ID.
    ---
    tags:
      - Assets
    parameters:
      - name: id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Asset details
        schema:
          $ref: '#/definitions/Asset'
      404:
        description: Asset not found
    """
    try:
        asset = Asset.query.get(id)
        if not asset:
            return jsonify({'error': 'Asset not found'}), 404
        return jsonify(asset.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@assets_bp.route('', methods=['POST'])
def create_asset():
    """Create a new asset. Auto-generates asset_id and journal entry.
    ---
    tags:
      - Assets
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - title
            - asset_type
          properties:
            title:
              type: string
            asset_type:
              type: string
              enum: [Hardware, Software, Contract, Project]
            status:
              type: string
              default: Active
            description:
              type: string
            start_date:
              type: string
              format: date
            end_date:
              type: string
              format: date
            total_budget:
              type: number
              default: 0
            spent_to_date:
              type: number
              default: 0
            vendor:
              type: string
            contract_number:
              type: string
            department:
              type: string
            owner_id:
              type: integer
            notes:
              type: string
    responses:
      201:
        description: Asset created
        schema:
          $ref: '#/definitions/Asset'
      400:
        description: Validation error
    """
    try:
        data = request.get_json()
        if not data or not data.get('title') or not data.get('asset_type'):
            return jsonify({'error': 'Title and asset_type are required'}), 400

        asset_id = IDCounter.generate_id('Assets')

        asset = Asset(
            asset_id=asset_id,
            title=data['title'],
            asset_type=data['asset_type'],
            status=data.get('status', 'Active'),
            description=data.get('description'),
            start_date=_parse_date(data.get('start_date')),
            end_date=_parse_date(data.get('end_date')),
            total_budget=data.get('total_budget', 0),
            spent_to_date=data.get('spent_to_date', 0),
            vendor=data.get('vendor'),
            contract_number=data.get('contract_number'),
            department=data.get('department'),
            owner_id=data.get('owner_id'),
            notes=data.get('notes'),
        )
        db.session.add(asset)
        db.session.flush()  # get asset.id before creating journal

        # Auto-create journal entry
        journal_id = IDCounter.generate_id('Journals')
        journal = Journal(
            journal_id=journal_id,
            title=f'Asset created: {asset.title}',
            body=f'New {asset.asset_type} asset "{asset.title}" ({asset_id}) was created.',
            entry_type='Milestone',
            asset_id=asset.id,
            related_asset_id_str=asset_id,
            department=asset.department,
            author_id=data.get('owner_id'),
        )
        db.session.add(journal)

        db.session.commit()
        return jsonify(asset.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@assets_bp.route('/<int:id>', methods=['PUT'])
def update_asset(id):
    """Update an existing asset.
    ---
    tags:
      - Assets
    parameters:
      - name: id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            title:
              type: string
            asset_type:
              type: string
            status:
              type: string
            description:
              type: string
            start_date:
              type: string
              format: date
            end_date:
              type: string
              format: date
            total_budget:
              type: number
            spent_to_date:
              type: number
            vendor:
              type: string
            contract_number:
              type: string
            department:
              type: string
            owner_id:
              type: integer
            notes:
              type: string
    responses:
      200:
        description: Updated asset
        schema:
          $ref: '#/definitions/Asset'
      400:
        description: No data provided
      404:
        description: Asset not found
    """
    try:
        asset = Asset.query.get(id)
        if not asset:
            return jsonify({'error': 'Asset not found'}), 404

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        updatable_fields = [
            'title', 'asset_type', 'status', 'description', 'vendor',
            'contract_number', 'department', 'owner_id', 'notes',
            'total_budget', 'spent_to_date',
        ]
        for field in updatable_fields:
            if field in data:
                setattr(asset, field, data[field])

        if 'start_date' in data:
            asset.start_date = _parse_date(data['start_date'])
        if 'end_date' in data:
            asset.end_date = _parse_date(data['end_date'])

        db.session.commit()
        return jsonify(asset.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@assets_bp.route('/<int:id>', methods=['DELETE'])
def delete_asset(id):
    """Delete an asset.
    ---
    tags:
      - Assets
    parameters:
      - name: id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Asset deleted
      404:
        description: Asset not found
    """
    try:
        asset = Asset.query.get(id)
        if not asset:
            return jsonify({'error': 'Asset not found'}), 404

        db.session.delete(asset)
        db.session.commit()
        return jsonify({'message': 'Asset deleted'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@assets_bp.route('/<int:id>/tasks', methods=['GET'])
def get_asset_tasks(id):
    """Get all tasks linked to an asset.
    ---
    tags:
      - Assets
    parameters:
      - name: id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: List of tasks for this asset
        schema:
          type: array
          items:
            $ref: '#/definitions/Task'
      404:
        description: Asset not found
    """
    try:
        asset = Asset.query.get(id)
        if not asset:
            return jsonify({'error': 'Asset not found'}), 404
        tasks = asset.tasks.order_by(Task.due_date.asc()).all()
        return jsonify([t.to_dict() for t in tasks])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@assets_bp.route('/<int:id>/journals', methods=['GET'])
def get_asset_journals(id):
    """Get all journal entries linked to an asset.
    ---
    tags:
      - Assets
    parameters:
      - name: id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: List of journal entries for this asset
        schema:
          type: array
          items:
            $ref: '#/definitions/Journal'
      404:
        description: Asset not found
    """
    try:
        asset = Asset.query.get(id)
        if not asset:
            return jsonify({'error': 'Asset not found'}), 404
        journals = asset.journals.order_by(Journal.entry_date.desc()).all()
        return jsonify([j.to_dict() for j in journals])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@assets_bp.route('/<int:id>/documents', methods=['GET'])
def get_asset_documents(id):
    """Get all documents linked to an asset.
    ---
    tags:
      - Assets
    parameters:
      - name: id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: List of documents for this asset
        schema:
          type: array
          items:
            $ref: '#/definitions/Document'
      404:
        description: Asset not found
    """
    try:
        asset = Asset.query.get(id)
        if not asset:
            return jsonify({'error': 'Asset not found'}), 404
        documents = asset.documents.order_by(Document.created_at.desc()).all()
        return jsonify([d.to_dict() for d in documents])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def _parse_date(value):
    """Parse a date string (YYYY-MM-DD) into a date object, or return None."""
    if not value:
        return None
    if isinstance(value, date):
        return value
    try:
        return datetime.strptime(value, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return None
