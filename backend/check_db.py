
from app import app, db, User

with app.app_context():
    users = User.query.all()
    print(f"Total de usuários: {len(users)}")
    if users:
        print("\nUsuários cadastrados:")
        for u in users:
            print(f"  - ID: {u.id}, Nome: {u.full_name}, Email: {u.email}")
    else:
        print("\nNenhum usuário cadastrado!")

