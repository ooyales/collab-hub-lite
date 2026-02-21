from app import db
from datetime import datetime


class Journal(db.Model):
    __tablename__ = 'journals'

    id = db.Column(db.Integer, primary_key=True)
    journal_id = db.Column(db.String(20), unique=True, nullable=False)  # JRN-00001
    title = db.Column(db.String(300), nullable=False)
    body = db.Column(db.Text)
    entry_date = db.Column(db.DateTime, default=datetime.utcnow)
    entry_type = db.Column(db.String(30), default='Note')  # Note, Update, Decision, Issue, Milestone
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'))
    related_asset_id_str = db.Column(db.String(20))
    department = db.Column(db.String(50))
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    author = db.relationship('User', backref='journal_entries')

    def to_dict(self):
        return {
            'id': self.id,
            'journal_id': self.journal_id,
            'title': self.title,
            'body': self.body,
            'entry_date': self.entry_date.isoformat() if self.entry_date else None,
            'entry_type': self.entry_type,
            'asset_id': self.asset_id,
            'related_asset_id_str': self.related_asset_id_str,
            'related_asset_title': self.related_asset.title if self.related_asset else None,
            'department': self.department,
            'author_id': self.author_id,
            'author_name': self.author.display_name if self.author else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
