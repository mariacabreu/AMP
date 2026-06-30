from app import app, db, User

with app.app_context():
    user = User.query.get(1)
    if user:
        print("Usuário ID 1:")
        print(f"Nome: {user.full_name}")
        print(f"Email: {user.email}")
        print(f"Senha armazenada (com repr): {repr(user.password)}")
    else:
        print("Usuário ID 1 não encontrado")
