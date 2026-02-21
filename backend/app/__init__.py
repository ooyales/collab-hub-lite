from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flasgger import Swagger
import os

db = SQLAlchemy()

SWAGGER_TEMPLATE = {
    "info": {
        "title": "Collab Hub Lite API",
        "description": "API for the Collaboration Hub — asset lifecycle management, task coordination, document registry, and executive dashboards.",
        "version": "1.0.0",
    },
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "Enter: **Bearer {user_id}** (e.g. `Bearer 1` for admin)"
        }
    },
    "security": [{"Bearer": []}],
    "basePath": "/",
    "schemes": ["http", "https"],
    "definitions": {
        "Error": {
            "type": "object",
            "properties": {
                "error": {"type": "string"}
            }
        },
        "User": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "email": {"type": "string"},
                "display_name": {"type": "string"},
                "role": {"type": "string", "enum": ["admin", "member", "visitor"]},
                "department": {"type": "string"},
                "is_active": {"type": "boolean"}
            }
        },
        "Asset": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "asset_id": {"type": "string", "description": "Auto-generated (AST-00001)"},
                "title": {"type": "string"},
                "asset_type": {"type": "string", "enum": ["Hardware", "Software", "Contract", "Project"]},
                "status": {"type": "string", "enum": ["Active", "Pending Renewal", "Expired", "Retired"]},
                "description": {"type": "string"},
                "start_date": {"type": "string", "format": "date"},
                "end_date": {"type": "string", "format": "date"},
                "total_budget": {"type": "number"},
                "spent_to_date": {"type": "number"},
                "remaining_budget": {"type": "number"},
                "budget_utilization_pct": {"type": "number"},
                "vendor": {"type": "string"},
                "contract_number": {"type": "string"},
                "department": {"type": "string"},
                "owner_id": {"type": "integer"},
                "owner_name": {"type": "string"},
                "notes": {"type": "string"},
                "days_until_expiration": {"type": "integer"},
                "is_expired": {"type": "boolean"},
                "is_expiring_soon": {"type": "boolean"},
                "expiration_category": {"type": "string"},
                "task_count": {"type": "integer"},
                "document_count": {"type": "integer"},
                "journal_count": {"type": "integer"},
                "created_at": {"type": "string", "format": "date-time"},
                "modified_at": {"type": "string", "format": "date-time"}
            }
        },
        "Task": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "task_id": {"type": "string", "description": "Auto-generated (TSK-00001)"},
                "title": {"type": "string"},
                "description": {"type": "string"},
                "priority": {"type": "string", "enum": ["Critical", "High", "Medium", "Low"]},
                "status": {"type": "string", "enum": ["Not Started", "In Progress", "Blocked", "Completed"]},
                "due_date": {"type": "string", "format": "date"},
                "completed_date": {"type": "string", "format": "date"},
                "assigned_to_id": {"type": "integer"},
                "assigned_to_name": {"type": "string"},
                "assigned_by_id": {"type": "integer"},
                "assigned_by_name": {"type": "string"},
                "asset_id": {"type": "integer"},
                "related_asset_id_str": {"type": "string"},
                "related_asset_title": {"type": "string"},
                "percent_complete": {"type": "integer"},
                "department": {"type": "string"},
                "bucket": {"type": "string"},
                "is_overdue": {"type": "boolean"},
                "days_overdue": {"type": "integer"},
                "completed_on_time": {"type": "boolean"},
                "created_at": {"type": "string", "format": "date-time"},
                "modified_at": {"type": "string", "format": "date-time"}
            }
        },
        "Journal": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "journal_id": {"type": "string", "description": "Auto-generated (JRN-00001)"},
                "title": {"type": "string"},
                "body": {"type": "string"},
                "entry_date": {"type": "string", "format": "date-time"},
                "entry_type": {"type": "string", "enum": ["Note", "Update", "Decision", "Issue", "Milestone"]},
                "asset_id": {"type": "integer"},
                "related_asset_id_str": {"type": "string"},
                "related_asset_title": {"type": "string"},
                "department": {"type": "string"},
                "author_id": {"type": "integer"},
                "author_name": {"type": "string"},
                "created_at": {"type": "string", "format": "date-time"}
            }
        },
        "Document": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "document_id": {"type": "string", "description": "Auto-generated (DOC-00001)"},
                "title": {"type": "string"},
                "document_type": {"type": "string", "enum": ["Contract", "Invoice", "SOW", "Proposal", "Technical", "Other"]},
                "cui_category": {"type": "string", "enum": ["Not CUI", "CUI Basic", "CUI Specified"]},
                "date_received": {"type": "string", "format": "date"},
                "asset_id": {"type": "integer"},
                "related_asset_id_str": {"type": "string"},
                "related_asset_title": {"type": "string"},
                "library_name": {"type": "string"},
                "department": {"type": "string"},
                "uploaded_by_id": {"type": "integer"},
                "uploaded_by_name": {"type": "string"},
                "file_url": {"type": "string"},
                "created_at": {"type": "string", "format": "date-time"}
            }
        },
        "Notification": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "user_id": {"type": "integer"},
                "title": {"type": "string"},
                "message": {"type": "string"},
                "notification_type": {"type": "string", "enum": ["info", "warning", "critical", "success"]},
                "is_read": {"type": "boolean"},
                "link": {"type": "string"},
                "created_at": {"type": "string", "format": "date-time"}
            }
        }
    }
}

SWAGGER_CONFIG = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec",
            "route": "/apispec.json",
            "rule_filter": lambda rule: rule.rule.startswith('/api/'),
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/apidocs/"
}


def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_CONFIG', 'development')

    app = Flask(__name__)
    app.url_map.strict_slashes = False

    from config import config as config_dict
    app.config.from_object(config_dict[config_name])

    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    Swagger(app, config=SWAGGER_CONFIG, template=SWAGGER_TEMPLATE)

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
        """Health check endpoint.
        ---
        tags:
          - System
        security: []
        responses:
          200:
            description: Service is healthy
        """
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
