# Backend AMP - Flask

Backend para o aplicativo AMP, construído com Flask e SQLAlchemy.

## Estrutura do Projeto
```
backend/
├── app/
│   ├── __init__.py     # Factory pattern do Flask
│   ├── config/
│   │   └── config.py   # Configurações (variáveis de ambiente)
│   ├── models/
│   │   └── models.py   # Modelos do SQLAlchemy
│   └── routes/
│       ├── vehicle_routes.py  # Rotas de veículos
│       └── user_routes.py     # Rotas de usuários
├── .env.example       # Exemplo de variáveis de ambiente
├── .gitignore
├── Procfile           # Para deploy no Render/Heroku
├── requirements.txt   # Dependências
└── run.py             # Arquivo de entrada
```

## Instalação Local

1. Crie um ambiente virtual e ative-o:
```bash
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate # Linux/Mac
```

2. Instale as dependências:
```bash
pip install -r requirements.txt
```

3. Copie `.env.example` para `.env` e configure as variáveis:
```bash
cp .env.example .env
```

4. Execute o servidor:
```bash
python run.py
```

## Deploy no Render (Recomendado - Gratuito!)

1. **Crie uma conta no Render**: https://render.com
2. **Crie um novo Web Service**:
   - Conecte seu repositório GitHub/GitLab
   - Escolha o branch principal
3. **Configure as opções**:
   - **Name**: Nome do seu serviço (ex: amp-backend)
   - **Region**: São Paulo (se disponível)
   - **Branch**: main (ou master)
   - **Root Directory**: backend
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn run:app`
4. **Adicione um Banco de Dados**:
   - Vá para **Resources > Add Database**
   - Escolha **PostgreSQL** (gratuita com limites)
   - Copie a **Internal Database URL** (ela será adicionada automaticamente como variável de ambiente `DATABASE_URL`)
5. **Configure as Variáveis de Ambiente**:
   - No painel do seu Web Service, vá para **Environment > Environment Variables**
   - Adicione `SECRET_KEY` (gere uma chave segura: ex: usando `python -c "import secrets; print(secrets.token_hex(32))"`)
6. **Deploy**: Clique em **Create Web Service** e aguarde!

## Deploy no Heroku

1. Instale o Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Login no Heroku:
```bash
heroku login
```
3. Crie um app:
```bash
heroku create seu-app-name
```
4. Adicione PostgreSQL:
```bash
heroku addons:create heroku-postgresql:mini
```
5. Configure as variáveis de ambiente:
```bash
heroku config:set SECRET_KEY=sua-chave-secreta-aqui
heroku config:set OPENAI_API_KEY=sua-chave-openai-aqui
```
6. Deploy:
```bash
git add .
git commit -m "Deploy backend"
git push heroku main
```

## Testes

Após deploy, você pode testar as rotas usando Postman ou curl. Exemplo:
```bash
curl https://seu-app.onrender.com/vehicle/brands
```

## Tecnologias
- Flask (framework web)
- SQLAlchemy (ORM)
- Flask-CORS
- PostgreSQL (produção)
- SQLite (desenvolvimento)
