import requests

# Cloud backend URL
CLOUD_API_URL = 'https://amp-project-back.onrender.com'

print("=== Testes usando backend na nuvem ===")
print(f"Backend: {CLOUD_API_URL}")

# Teste 0: Root endpoint
print("\n=== Teste 0: Endpoint raiz / ===")
try:
    response = requests.get(f'{CLOUD_API_URL}/')
    print(f"Status: {response.status_code}")
    print(f"Resposta: {response.json()}")
except Exception as e:
    print(f"Erro: {e}")

# Teste 1: Usar o endpoint /register
print("\n=== Teste 1: Usar o endpoint /register ===")
try:
    response = requests.post(f'{CLOUD_API_URL}/register', json={
        'full_name': 'Teste User Cloud',
        'email': 'testecloud@teste.com',
        'password': '123456'
    })
    print(f"Status: {response.status_code}")
    print(f"Resposta: {response.json()}")
except Exception as e:
    print(f"Erro: {e}")

print("\n=== Testes finalizados ===")
