from app import db


class IDCounter(db.Model):
    __tablename__ = 'id_counters'

    id = db.Column(db.Integer, primary_key=True)
    list_type = db.Column(db.String(50), unique=True, nullable=False)  # Assets, Tasks, Journals, Documents
    prefix = db.Column(db.String(10), nullable=False)  # AST, TSK, JRN, DOC
    current_value = db.Column(db.Integer, default=0)

    @classmethod
    def generate_id(cls, list_type):
        counter = cls.query.filter_by(list_type=list_type).first()
        if not counter:
            raise ValueError(f"No counter found for list type: {list_type}")
        counter.current_value += 1
        generated = f"{counter.prefix}-{counter.current_value:05d}"
        return generated
