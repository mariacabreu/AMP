from app import app, db, User

with app.app_context():
    user = User.query.get(1)
    if user:
        print(f"Usuário ID {user.id}")
        print(f"Nome: {user.full_name}")
        print(f"Email: {user.email}")
        print(f"Senha armazenada: {user.password}")
    else:
        print("Usuário ID 1 não encontrado")
