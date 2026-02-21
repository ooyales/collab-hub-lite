from app import db
from datetime import datetime


class Document(db.Model):
    __tablename__ = 'documents'

    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.String(20), unique=True, nullable=False)  # DOC-00001
    title = db.Column(db.String(300), nullable=False)
    document_type = db.Column(db.String(50), nullable=False)  # Contract, Invoice, SOW, Proposal, Technical, Other
    cui_category = db.Column(db.String(50), default='Not CUI')  # Not CUI, CUI Basic, CUI Specified
    date_received = db.Column(db.Date)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'))
    related_asset_id_str = db.Column(db.String(20))
    library_name = db.Column(db.String(100))  # Contract Documents, Financial Documents, Technical Documents
    department = db.Column(db.String(50))
    uploaded_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    file_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    uploaded_by = db.relationship('User', backref='uploaded_documents')

    def to_dict(self):
        return {
            'id': self.id,
            'document_id': self.document_id,
            'title': self.title,
            'document_type': self.document_type,
            'cui_category': self.cui_category,
            'date_received': self.date_received.isoformat() if self.date_received else None,
            'asset_id': self.asset_id,
            'related_asset_id_str': self.related_asset_id_str,
            'related_asset_title': self.related_asset.title if self.related_asset else None,
            'library_name': self.library_name,
            'department': self.department,
            'uploaded_by_id': self.uploaded_by_id,
            'uploaded_by_name': self.uploaded_by.display_name if self.uploaded_by else None,
            'file_url': self.file_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
