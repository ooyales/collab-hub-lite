import os
from app import create_app, db
from app.seed_data import seed_all

config_name = os.environ.get('FLASK_CONFIG', 'development')
app = create_app(config_name)

with app.app_context():
    db.create_all()
    from app.models import User
    if User.query.count() == 0:
        print("First run detected — seeding database...")
        seed_all(db)
        print("Database seeded successfully.")
    else:
        print(f"Database already has {User.query.count()} users, skipping seed.")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
