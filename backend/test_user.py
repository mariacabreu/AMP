
from app import app, db, User
import requests

with app.app_context():
    # Teste 1: Criar usuário diretamente pelo banco
    print("=== Teste 1: Criar usuário diretamente ===")
    new_user = User(full_name="Teste User", email="teste@teste.com", password="123456")
    db.session.add(new_user)
    db.session.commit()
    print("Usuário criado diretamente!")
    
    # Verificar
    users = User.query.all()
    print(f"Usuários no banco: {len(users)}")
    for u in users:
        print(f"  - {u.email}")
    
    # Teste 2: Usar o endpoint diretamente
    print("\n=== Teste 2: Usar o endpoint /register ===")
    try:
        response = requests.post('http://localhost:5000/register', json={
            'full_name': 'Teste User 2',
            'email': 'teste2@teste.com',
            'password': '123456'
        })
        print(f"Status: {response.status_code}")
        print(f"Resposta: {response.json()}")
    except Exception as e:
        print(f"Erro: {e}")

