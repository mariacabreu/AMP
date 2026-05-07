from app import app, db, User, Vehicle
import os

with app.app_context():
    # Delete the database file and recreate tables to start fresh
    db_path = 'amp_db.db'
    if os.path.exists(db_path):
        db.session.remove()
        db.drop_all()
        print("Banco de dados resetado com sucesso.")
    
    db.create_all()
    print("Tabelas recriadas.")
