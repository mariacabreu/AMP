from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from app.config.config import Config
import os

db = SQLAlchemy()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    CORS(app, resources={r"/*": {"origins": "*"}})

    from app.routes.vehicle_routes import vehicle_bp
    from app.routes.user_routes import user_bp

    app.register_blueprint(vehicle_bp)
    app.register_blueprint(user_bp)

    with app.app_context():
        db.create_all()

    return app

