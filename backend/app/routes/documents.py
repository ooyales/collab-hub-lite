from flask import Blueprint, request, jsonify
from app import db
from app.models import Asset, Document, Journal, IDCounter
from app.routes.auth import get_current_user
from datetime import datetime

documents_bp = Blueprint('documents', __name__)

# Map document_type to library_name
LIBRARY_MAP = {
    'Contract': 'Contract Documents',
    'SOW': 'Contract Documents',
    'Proposal': 'Contract Documents',
    'Invoice': 'Financial Documents',
    'Technical': 'Technical Documents',
    'Other': 'Technical Documents',
}


@documents_bp.route('', methods=['GET'])
def list_documents():
    """List all documents with optional filters.
    ---
    tags:
      - Documents
    parameters:
      - name: document_type
        in: query
        type: string
        required: false
        enum: [Contract, Invoice, SOW, Proposal, Technical, Other]
      - name: cui_category
        in: query
        type: string
        required: false
        enum: [Not CUI, CUI Basic, CUI Specified]
      - name: department
        in: query
        type: string
        required: false
      - name: asset_id
        in: query
        type: integer
        required: false
        description: Filter by linked asset
      - name: search
        in: query
        type: string
        required: false
        description: Search across title, document_id, document_type
      - name: sort
        in: query
        type: string
        required: false
        default: created_at
      - name: order
        in: query
        type: string
        required: false
        default: desc
        enum: [asc, desc]
    responses:
      200:
        description: List of documents
        schema:
          type: array
          items:
            $ref: '#/definitions/Document'
    """
    try:
        query = Document.query

        # Filters
        document_type = request.args.get('document_type')
        if document_type:
            query = query.filter(Document.document_type == document_type)

        cui_category = request.args.get('cui_category')
        if cui_category:
            query = query.filter(Document.cui_category == cui_category)

        department = request.args.get('department')
        if department:
            query = query.filter(Document.department == department)

        asset_id = request.args.get('asset_id')
        if asset_id:
            query = query.filter(Document.asset_id == int(asset_id))

        search = request.args.get('search')
        if search:
            pattern = f'%{search}%'
            query = query.filter(
                db.or_(
                    Document.title.ilike(pattern),
                    Document.document_id.ilike(pattern),
                    Document.document_type.ilike(pattern),
                )
            )

        # Sort
        sort_field = request.args.get('sort', 'created_at')
        order = request.args.get('order', 'desc')

        sort_column = getattr(Document, sort_field, Document.created_at)
        if order == 'asc':
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        documents = query.all()
        return jsonify([d.to_dict() for d in documents])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@documents_bp.route('/<int:id>', methods=['GET'])
def get_document(id):
    """Get a single document by ID.
    ---
    tags:
      - Documents
    parameters:
      - name: id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Document details
        schema:
          $ref: '#/definitions/Document'
      404:
        description: Document not found
    """
    try:
        doc = Document.query.get(id)
        if not doc:
            return jsonify({'error': 'Document not found'}), 404
        return jsonify(doc.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@documents_bp.route('', methods=['POST'])
def create_document():
    """Create a new document. Auto-routes to library and creates journal entry.
    ---
    tags:
      - Documents
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - title
            - document_type
          properties:
            title:
              type: string
            document_type:
              type: string
              enum: [Contract, Invoice, SOW, Proposal, Technical, Other]
            cui_category:
              type: string
              default: Not CUI
              enum: [Not CUI, CUI Basic, CUI Specified]
            date_received:
              type: string
              format: date
            asset_id:
              type: integer
            library_name:
              type: string
              description: Override auto-routing (defaults based on document_type)
            department:
              type: string
            uploaded_by_id:
              type: integer
            file_url:
              type: string
    responses:
      201:
        description: Document created
        schema:
          $ref: '#/definitions/Document'
      400:
        description: Title and document_type required
    """
    try:
        data = request.get_json()
        if not data or not data.get('title') or not data.get('document_type'):
            return jsonify({'error': 'Title and document_type are required'}), 400

        document_id = IDCounter.generate_id('Documents')
        current_user = get_current_user()

        doc_type = data['document_type']
        library_name = data.get('library_name') or LIBRARY_MAP.get(doc_type, 'Technical Documents')

        # Look up related asset
        related_asset = None
        asset_id_val = data.get('asset_id')
        if asset_id_val:
            related_asset = Asset.query.get(int(asset_id_val))

        date_received = None
        if data.get('date_received'):
            try:
                date_received = datetime.strptime(data['date_received'], '%Y-%m-%d').date()
            except (ValueError, TypeError):
                pass

        doc = Document(
            document_id=document_id,
            title=data['title'],
            document_type=doc_type,
            cui_category=data.get('cui_category', 'Not CUI'),
            date_received=date_received,
            asset_id=asset_id_val,
            related_asset_id_str=related_asset.asset_id if related_asset else data.get('related_asset_id_str'),
            library_name=library_name,
            department=data.get('department') or (related_asset.department if related_asset else None),
            uploaded_by_id=current_user.id if current_user else data.get('uploaded_by_id'),
            file_url=data.get('file_url'),
        )
        db.session.add(doc)
        db.session.flush()

        # Auto-create journal entry
        if asset_id_val:
            journal_id = IDCounter.generate_id('Journals')
            journal = Journal(
                journal_id=journal_id,
                title=f'Document uploaded: {doc.title}',
                body=f'{doc_type} document "{doc.title}" ({document_id}) was uploaded to {library_name}.',
                entry_type='Update',
                asset_id=asset_id_val,
                related_asset_id_str=doc.related_asset_id_str,
                department=doc.department,
                author_id=current_user.id if current_user else None,
            )
            db.session.add(journal)

        db.session.commit()
        return jsonify(doc.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@documents_bp.route('/<int:id>', methods=['DELETE'])
def delete_document(id):
    """Delete a document.
    ---
    tags:
      - Documents
    parameters:
      - name: id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Document deleted
      404:
        description: Document not found
    """
    try:
        doc = Document.query.get(id)
        if not doc:
            return jsonify({'error': 'Document not found'}), 404

        db.session.delete(doc)
        db.session.commit()
        return jsonify({'message': 'Document deleted'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
