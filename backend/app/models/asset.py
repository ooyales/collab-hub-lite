from app import db
from datetime import datetime, date


class Asset(db.Model):
    __tablename__ = 'assets'

    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.String(20), unique=True, nullable=False)  # AST-00001
    title = db.Column(db.String(200), nullable=False)
    asset_type = db.Column(db.String(50), nullable=False)  # Hardware, Software, Contract, Project
    status = db.Column(db.String(50), nullable=False, default='Active')  # Active, Pending Renewal, Expired, Retired
    description = db.Column(db.Text)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    total_budget = db.Column(db.Float, default=0)
    spent_to_date = db.Column(db.Float, default=0)
    vendor = db.Column(db.String(200))
    contract_number = db.Column(db.String(100))
    department = db.Column(db.String(50))
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    modified_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = db.relationship('User', backref='owned_assets', foreign_keys=[owner_id])
    tasks = db.relationship('Task', backref='related_asset', lazy='dynamic')
    journals = db.relationship('Journal', backref='related_asset', lazy='dynamic')
    documents = db.relationship('Document', backref='related_asset', lazy='dynamic')

    @property
    def days_until_expiration(self):
        if not self.end_date:
            return None
        return (self.end_date - date.today()).days

    @property
    def is_expired(self):
        if not self.end_date:
            return False
        return self.end_date < date.today()

    @property
    def is_expiring_soon(self):
        d = self.days_until_expiration
        if d is None:
            return False
        return 0 < d <= 30

    @property
    def remaining_budget(self):
        return (self.total_budget or 0) - (self.spent_to_date or 0)

    @property
    def budget_utilization_pct(self):
        if not self.total_budget or self.total_budget == 0:
            return 0
        return (self.spent_to_date or 0) / self.total_budget

    @property
    def expiration_category(self):
        if self.is_expired:
            return 'Expired'
        d = self.days_until_expiration
        if d is None:
            return 'No Expiration'
        if d <= 7:
            return '7 Days'
        if d <= 30:
            return '30 Days'
        if d <= 60:
            return '60 Days'
        if d <= 90:
            return '90 Days'
        return '90+ Days'

    def to_dict(self):
        return {
            'id': self.id,
            'asset_id': self.asset_id,
            'title': self.title,
            'asset_type': self.asset_type,
            'status': self.status,
            'description': self.description,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'total_budget': self.total_budget,
            'spent_to_date': self.spent_to_date,
            'remaining_budget': self.remaining_budget,
            'budget_utilization_pct': self.budget_utilization_pct,
            'vendor': self.vendor,
            'contract_number': self.contract_number,
            'department': self.department,
            'owner_id': self.owner_id,
            'owner_name': self.owner.display_name if self.owner else None,
            'notes': self.notes,
            'days_until_expiration': self.days_until_expiration,
            'is_expired': self.is_expired,
            'is_expiring_soon': self.is_expiring_soon,
            'expiration_category': self.expiration_category,
            'task_count': self.tasks.count(),
            'document_count': self.documents.count(),
            'journal_count': self.journals.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'modified_at': self.modified_at.isoformat() if self.modified_at else None,
        }
