from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sqlalchemy import inspect, text
from app.config.config import Config
import os

db = SQLAlchemy()


def ensure_database_schema():
    inspector = inspect(db.engine)

    if 'user' not in inspector.get_table_names():
        return

    user_columns = {column['name'] for column in inspector.get_columns('user')}
    missing_user_columns = []

    if 'plan_type' not in user_columns:
        missing_user_columns.append(
            'ALTER TABLE "user" ADD COLUMN plan_type VARCHAR(20) DEFAULT \'free\''
        )
    if 'reminder_frequency' not in user_columns:
        missing_user_columns.append(
            'ALTER TABLE "user" ADD COLUMN reminder_frequency VARCHAR(50) DEFAULT \'biweekly\''
        )
    if 'phone' not in user_columns:
        missing_user_columns.append(
            'ALTER TABLE "user" ADD COLUMN phone VARCHAR(20)'
        )
    if 'avatar' not in user_columns:
        missing_user_columns.append(
            'ALTER TABLE "user" ADD COLUMN avatar TEXT'
        )

    if not missing_user_columns:
        return

    with db.engine.begin() as connection:
        for statement in missing_user_columns:
            connection.execute(text(statement))


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Root route
    @app.route('/', methods=['GET'])
    def index():
        return jsonify({
            'message': 'AMP Backend API is running',
            'status': 'ok'
        }), 200

    from app.routes.vehicle_routes import vehicle_bp
    from app.routes.user_routes import user_bp

    app.register_blueprint(vehicle_bp)
    app.register_blueprint(user_bp)

    with app.app_context():
        db.create_all()
        ensure_database_schema()

    return app

