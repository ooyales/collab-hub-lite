from app import db
from datetime import datetime, date


class Task(db.Model):
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.String(20), unique=True, nullable=False)  # TSK-00001
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text)
    priority = db.Column(db.String(20), nullable=False, default='Medium')  # Critical, High, Medium, Low
    status = db.Column(db.String(30), nullable=False, default='Not Started')  # Not Started, In Progress, Blocked, Completed
    due_date = db.Column(db.Date)
    completed_date = db.Column(db.Date)
    assigned_to_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    assigned_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'))
    related_asset_id_str = db.Column(db.String(20))  # AST-00001 string ref
    percent_complete = db.Column(db.Integer, default=0)
    department = db.Column(db.String(50))
    bucket = db.Column(db.String(50))  # Hardware, Software, Contract, Project, General
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    modified_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assigned_to = db.relationship('User', foreign_keys=[assigned_to_id], backref='assigned_tasks')
    assigned_by = db.relationship('User', foreign_keys=[assigned_by_id])

    @property
    def is_overdue(self):
        if not self.due_date or self.status == 'Completed':
            return False
        return self.due_date < date.today()

    @property
    def days_overdue(self):
        if not self.is_overdue:
            return 0
        return (date.today() - self.due_date).days

    @property
    def completed_on_time(self):
        if self.status != 'Completed' or not self.completed_date or not self.due_date:
            return None
        return self.completed_date <= self.due_date

    def to_dict(self):
        return {
            'id': self.id,
            'task_id': self.task_id,
            'title': self.title,
            'description': self.description,
            'priority': self.priority,
            'status': self.status,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'completed_date': self.completed_date.isoformat() if self.completed_date else None,
            'assigned_to_id': self.assigned_to_id,
            'assigned_to_name': self.assigned_to.display_name if self.assigned_to else None,
            'assigned_by_id': self.assigned_by_id,
            'assigned_by_name': self.assigned_by.display_name if self.assigned_by else None,
            'asset_id': self.asset_id,
            'related_asset_id_str': self.related_asset_id_str,
            'related_asset_title': self.related_asset.title if self.related_asset else None,
            'percent_complete': self.percent_complete,
            'department': self.department,
            'bucket': self.bucket,
            'is_overdue': self.is_overdue,
            'days_overdue': self.days_overdue,
            'completed_on_time': self.completed_on_time,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'modified_at': self.modified_at.isoformat() if self.modified_at else None,
        }
