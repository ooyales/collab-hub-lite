from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os

db = SQLAlchemy()


def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_CONFIG', 'development')

    app = Flask(__name__)

    from config import config as config_dict
    app.config.from_object(config_dict[config_name])

    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    from app.routes.auth import auth_bp
    from app.routes.assets import assets_bp
    from app.routes.tasks import tasks_bp
    from app.routes.journals import journals_bp
    from app.routes.documents import documents_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.notifications import notifications_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(assets_bp, url_prefix='/api/assets')
    app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
    app.register_blueprint(journals_bp, url_prefix='/api/journals')
    app.register_blueprint(documents_bp, url_prefix='/api/documents')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')

    @app.route('/api/health')
    def health():
        return {'status': 'ok'}

    # Demo auth (enabled via DEMO_AUTH_ENABLED env var)
    try:
        from demo_auth import init_demo_auth
        from demo_sessions import SessionManager
        db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        if db_uri.startswith('sqlite:///'):
            template_db = db_uri.replace('sqlite:///', '')
        else:
            template_db = os.path.join(app.instance_path, 'collab_hub.db')
        _session_mgr = SessionManager(
            template_db=template_db,
            sessions_dir=os.path.join(os.path.dirname(app.instance_path), 'data', 'sessions')
        )
        init_demo_auth(app, session_manager=_session_mgr)
    except ImportError:
        pass

    return app
