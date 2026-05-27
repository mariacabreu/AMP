from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Database configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'amp_db.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    vehicles = db.relationship('Vehicle', backref='owner', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email
        }

# Vehicle Model
class Vehicle(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    brand = db.Column(db.String(50), nullable=False)
    model = db.Column(db.String(50), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    transmission = db.Column(db.String(20))
    mileage = db.Column(db.Integer)
    fuel_type = db.Column(db.String(20))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Novas colunas para manutenção preventiva
    last_oil_change = db.Column(db.Integer, default=0)
    last_belt_change = db.Column(db.Integer, default=0)
    last_brake_change = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'brand': self.brand,
            'model': self.model,
            'year': self.year,
            'transmission': self.transmission,
            'mileage': self.mileage,
            'fuel_type': self.fuel_type,
            'last_oil_change': self.last_oil_change,
            'last_belt_change': self.last_belt_change,
            'last_brake_change': self.last_brake_change,
            'maintenance_history': [h.to_dict() for h in self.maintenance_history]
        }

# Maintenance History Model
class MaintenanceHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicle.id'), nullable=False)
    item = db.Column(db.String(100), nullable=False) # e.g., "Troca de Óleo", "Troca de Pneus"
    last_km = db.Column(db.Integer, nullable=False)
    last_date = db.Column(db.String(20)) # e.g., "2024-01-01"
    cost = db.Column(db.Float, default=0.0)
    liters = db.Column(db.Float, default=0.0)
    
    vehicle = db.relationship('Vehicle', backref=db.backref('maintenance_history', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'item': self.item,
            'last_km': self.last_km,
            'last_date': self.last_date,
            'cost': self.cost,
            'liters': self.liters
        }

# Predefined "Supported" Vehicle Data (OBD-II Bluetooth + API/Doc compatible)
SUPPORTED_BRANDS = {
    'Ford': {
        'models': ['Fiesta', 'Focus', 'Ranger', 'Ka', 'EcoSport', 'Fusion', 'Edge', 'Mustang', 'Territory', 'Bronco'],
        'start_year': 2010,
        'docs': 'Ford Developer API / OpenXC'
    },
    'Chevrolet': {
        'models': ['Onix', 'Prisma', 'Cruze', 'S10', 'Tracker', 'Spin', 'Montana', 'Equinox', 'Trailblazer', 'Camaro'],
        'start_year': 2011,
        'docs': 'GM Developer Portal'
    },
    'Volkswagen': {
        'models': ['Gol', 'Polo', 'Golf', 'T-Cross', 'Amarok', 'Virtus', 'Nivus', 'Taos', 'Jetta', 'Tiguan', 'Voyage', 'Saveiro'],
        'start_year': 2010,
        'docs': 'VW Car-Net API'
    },
    'Toyota': {
        'models': ['Corolla', 'Hilux', 'Yaris', 'Etios', 'SW4', 'Rav4', 'Camry', 'Prius', 'Corolla Cross'],
        'start_year': 2012,
        'docs': 'Toyota Connected Services API'
    },
    'Honda': {
        'models': ['Civic', 'Fit', 'City', 'HR-V', 'CR-V', 'WR-V', 'Accord'],
        'start_year': 2012,
        'docs': 'Honda Developer Studio'
    },
    'Hyundai': {
        'models': ['HB20', 'Creta', 'Tucson', 'i30', 'Santa Fe', 'Azera', 'Elantra', 'Ix35'],
        'start_year': 2012,
        'docs': 'Hyundai Bluelink API'
    },
    'Fiat': {
        'models': ['Uno', 'Palio', 'Argo', 'Cronos', 'Toro', 'Mobi', 'Strada', 'Fastback', 'Pulse', 'Fiorino', 'Siena'],
        'start_year': 2010,
        'docs': 'FCA Developer Portal'
    },
    'Renault': {
        'models': ['Sandero', 'Logan', 'Duster', 'Kwid', 'Oroch', 'Captur', 'Master', 'Stepway'],
        'start_year': 2012,
        'docs': 'Renault Connected Services'
    },
    'Jeep': {
        'models': ['Renegade', 'Compass', 'Commander', 'Wrangler', 'Cherokee'],
        'start_year': 2015,
        'docs': 'FCA Developer Portal'
    },
    'Nissan': {
        'models': ['March', 'Versa', 'Kicks', 'Frontier', 'Sentra', 'Leaf'],
        'start_year': 2012,
        'docs': 'Nissan Connect API'
    },
    'Mitsubishi': {
        'models': ['L200', 'Pajero', 'ASX', 'Eclipse Cross', 'Outlander'],
        'start_year': 2010,
        'docs': 'Mitsubishi Motors API'
    },
    'Peugeot': {
        'models': ['208', '2008', '3008', '5008', 'Partner', 'Expert'],
        'start_year': 2015,
        'docs': 'PSA Group API'
    },
    'Citroën': {
        'models': ['C3', 'C4 Cactus', 'C4 Lounge', 'Berlingo', 'Jumpy'],
        'start_year': 2015,
        'docs': 'PSA Group API'
    },
    'BMW': {
        'models': ['Série 3', 'Série 1', 'X1', 'X3', 'X5', 'Série 5'],
        'start_year': 2014,
        'docs': 'BMW ConnectedDrive API'
    },
    'Mercedes-Benz': {
        'models': ['Classe A', 'Classe C', 'GLA', 'GLC', 'GLE', 'Classe E'],
        'start_year': 2014,
        'docs': 'Mercedes-Benz Developers'
    },
    'Audi': {
        'models': ['A3', 'A4', 'Q3', 'Q5', 'A5', 'Q7'],
        'start_year': 2014,
        'docs': 'Audi API Portal'
    },
    'Kia': {
        'models': ['Sportage', 'Cerato', 'Sorento', 'Rio', 'Picanto', 'Stonic', 'Niro'],
        'start_year': 2012,
        'docs': 'Kia Connect API'
    },
    'Chery': {
        'models': ['Tiggo 2', 'Tiggo 5X', 'Tiggo 7', 'Tiggo 8', 'Arrizo 5', 'Arrizo 6'],
        'start_year': 2018,
        'docs': 'Caoa Chery API'
    }
}

# Create database and tables
def create_tables():
    with app.app_context():
        # Ensure tables are created with new columns
        db.create_all()

# Initial table creation
create_tables()

@app.route('/vehicle/brands', methods=['GET'])
def get_brands():
    return jsonify(list(SUPPORTED_BRANDS.keys())), 200

@app.route('/vehicle/models/<brand>', methods=['GET'])
def get_models(brand):
    if brand in SUPPORTED_BRANDS:
        return jsonify(SUPPORTED_BRANDS[brand]['models']), 200
    return jsonify({'error': 'Brand not supported'}), 404

@app.route('/vehicle/years/<brand>', methods=['GET'])
def get_years(brand):
    if brand in SUPPORTED_BRANDS:
        current_year = 2026
        start_year = SUPPORTED_BRANDS[brand]['start_year']
        years = list(range(current_year, start_year - 1, -1))
        return jsonify(years), 200
    return jsonify({'error': 'Brand not supported'}), 404

@app.route('/vehicle/register', methods=['POST'])
def register_vehicle():
    data = request.json
    if not data or not all(k in data for k in ('brand', 'model', 'year', 'user_id')):
        return jsonify({'error': 'Missing required fields'}), 400
    
    new_vehicle = Vehicle(
        brand=data['brand'],
        model=data['model'],
        year=data['year'],
        transmission=data.get('transmission'),
        mileage=data.get('mileage', 0),
        fuel_type=data.get('fuel_type'),
        user_id=data['user_id'],
        last_oil_change=data.get('last_oil_change', 0),
        last_belt_change=data.get('last_belt_change', 0),
        last_brake_change=data.get('last_brake_change', 0)
    )
    
    try:
        db.session.add(new_vehicle)
        db.session.commit()
        return jsonify({'message': 'Vehicle registered successfully', 'vehicle': new_vehicle.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/vehicle/checklist/<int:vehicle_id>', methods=['GET'])
def get_vehicle_checklist(vehicle_id):
    vehicle = Vehicle.query.get(vehicle_id)
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404
        
    current_km = vehicle.mileage
    checklist = []
    
    # 1. Troca de Óleo (Geralmente a cada 10.000km)
    oil_diff = current_km - vehicle.last_oil_change
    if oil_diff >= 9000: # Alerta com 1000km de antecedência
        checklist.append({
            'id': 1,
            'name': 'Troca de Óleo e Filtro',
            'description': f'Já se passaram {oil_diff}km desde a última troca.',
            'reason': 'O óleo perde a viscosidade e capacidade de lubrificação com o tempo/uso, podendo fundir o motor.',
            'priority': 'URGENTE' if oil_diff >= 10000 else 'PRÓXIMOS 30 DIAS',
            'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Oil_filter_2.jpg/800px-Oil_filter_2.jpg'
        })

    # 2. Correia Dentada (Geralmente a cada 50.000km ou 60.000km)
    belt_diff = current_km - vehicle.last_belt_change
    if belt_diff >= 45000:
        checklist.append({
            'id': 2,
            'name': 'Correia Dentada',
            'description': f'Seu carro rodou {belt_diff}km com a correia atual.',
            'reason': 'A quebra da correia causa o atropelamento de válvulas, um dano gravíssimo e caro no cabeçote.',
            'priority': 'URGENTE' if belt_diff >= 55000 else 'PRÓXIMOS 60 DIAS',
            'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Timing_belt.jpg/800px-Timing_belt.jpg'
        })

    # 3. Pastilhas de Freio (Geralmente a cada 20.000km)
    brake_diff = current_km - vehicle.last_brake_change
    if brake_diff >= 18000:
        checklist.append({
            'id': 3,
            'name': 'Pastilhas de Freio',
            'description': f'Última revisão foi há {brake_diff}km.',
            'reason': 'Pastilhas gastas perdem eficiência de frenagem e podem danificar os discos de freio.',
            'priority': 'URGENTE' if brake_diff >= 22000 else 'PRÓXIMOS 30 DIAS',
            'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Brake_pad.jpg/800px-Brake_pad.jpg'
        })

    # 4. Filtro de Ar (Geralmente a cada 10.000km junto com o óleo)
    if oil_diff >= 9000:
        checklist.append({
            'id': 4,
            'name': 'Filtro de Ar do Motor',
            'description': 'Recomendado trocar junto com o óleo.',
            'reason': 'Filtro sujo aumenta o consumo e diminui o desempenho do motor.',
            'priority': 'PRÓXIMOS 30 DIAS',
            'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Air_filter.jpg/800px-Air_filter.jpg'
        })

    # 5. Fluido de Arrefecimento (Anual ou a cada 30.000km)
    if current_km >= 30000:
        checklist.append({
            'id': 5,
            'name': 'Fluido do Radiador',
            'description': 'Verificar nível e aditivo.',
            'reason': 'Evita oxidação interna e superaquecimento do motor.',
            'priority': 'PRÓXIMOS 90 DIAS',
            'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Radiator_fluid.jpg/800px-Radiator_fluid.jpg'
        })

    return jsonify({
        'vehicle': f"{vehicle.brand} {vehicle.model}",
        'mileage': current_km,
        'checklist': checklist
    }), 200

@app.route('/vehicle/maintenance', methods=['POST'])
def save_maintenance():
    print("\n=== NOVO REGISTRO DE MANUTENÇÃO ===")
    data = request.json
    print(f"Dados recebidos: {data}")
    
    if not data or not data.get('vehicle_id') or not data.get('history'):
        print("Erro: Dados obrigatórios ausentes")
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        vehicle_id = data['vehicle_id']
        # Verificar se o veículo existe
        vehicle = Vehicle.query.get(vehicle_id)
        if not vehicle:
            print(f"Erro: Veículo ID {vehicle_id} não encontrado no banco")
            # Fallback: se não achar, tentar pegar o primeiro veículo do sistema para não dar erro 500
            vehicle = Vehicle.query.first()
            if not vehicle:
                return jsonify({'error': 'Nenhum veículo cadastrado no sistema'}), 404
            vehicle_id = vehicle.id
            print(f"Usando fallback para Veículo ID: {vehicle_id}")

        for entry in data['history']:
            print(f"Processando entrada: {entry}")
            new_entry = MaintenanceHistory(
                vehicle_id=vehicle_id,
                item=entry['item'],
                last_km=entry.get('last_km', 0),
                last_date=entry.get('last_date'),
                cost=float(entry.get('cost', 0.0)),
                liters=float(entry.get('liters', 0.0))
            )
            db.session.add(new_entry)
        
        db.session.commit()
        print("Registro salvo com sucesso!")
        return jsonify({'message': 'Maintenance history saved successfully'}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao salvar no banco: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/user/report/<int:user_id>', methods=['GET'])
def get_user_report(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    vehicles = Vehicle.query.filter_by(user_id=user_id).all()
    all_history = []
    for v in vehicles:
        for h in v.maintenance_history:
            history_dict = h.to_dict()
            history_dict['vehicle_model'] = v.model
            all_history.append(history_dict)
            
    # Sort history by date (simplified, assuming YYYY-MM-DD or similar)
    all_history.sort(key=lambda x: x['last_date'] if x['last_date'] else '', reverse=True)
    
    # Get the latest vehicle ID to facilitate adding new costs from the report screen
    latest_vehicle = Vehicle.query.filter_by(user_id=user_id).order_by(Vehicle.id.desc()).first()
    
    return jsonify({
        'user_name': user.full_name,
        'history': all_history,
        'vehicle_id': latest_vehicle.id if latest_vehicle else None
    }), 200

@app.route('/user/status/<int:user_id>', methods=['GET'])
def get_user_status(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    vehicle = Vehicle.query.filter_by(user_id=user_id).order_by(Vehicle.id.desc()).first()
    
    status = {
        'user_name': user.full_name,
        'vehicle': vehicle.to_dict() if vehicle else None,
        'recommendation': "Nenhuma recomendação no momento."
    }
    
    if vehicle:
        current_km = vehicle.mileage
        
        # Lógica baseada no novo campo last_oil_change
        oil_diff = current_km - vehicle.last_oil_change
        if oil_diff >= 9000:
            status['recommendation'] = f"Seu carro está com {current_km} km. Troca de óleo necessária (última há {oil_diff} km)!"
        else:
            next_change = vehicle.last_oil_change + 10000
            status['recommendation'] = f"Próxima troca de óleo estimada aos {next_change} km."
            
        # Prioridade para Correia Dentada se estiver crítica
        belt_diff = current_km - vehicle.last_belt_change
        if belt_diff >= 45000:
            status['recommendation'] = f"ALERTA CRÍTICO: Correia dentada rodou {belt_diff} km. Troque agora para evitar danos!"

    return jsonify(status), 200

# --- AI Powered Endpoints ---

def validate_and_fix_images(data, key):
    """Garante que todos os links de imagem sejam da Wikimedia Commons."""
    fallback_image = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Oil_filter_2.jpg/800px-Oil_filter_2.jpg"
    valid_prefix = "https://upload.wikimedia.org"
    
    if key in data:
        for item in data[key]:
            img_url = item.get('image_url', '')
            if not img_url.startswith(valid_prefix):
                print(f"Fixing invalid image URL: {img_url}")
                item['image_url'] = fallback_image
    return data

@app.route('/vehicle/parts/ai/<int:vehicle_id>', methods=['GET'])
def get_vehicle_parts_ai(vehicle_id):
    vehicle = Vehicle.query.get(vehicle_id)
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404

    # Check if API Key is configured
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here":
        print("OpenAI API Key missing. Falling back to static parts catalog.")
        return get_vehicle_parts(vehicle_id)

    prompt = f"""
    Como um engenheiro mecânico automotivo sênior, gere um catálogo TÉCNICO COMPLETO e EXAUSTIVO de peças para um {vehicle.brand} {vehicle.model} {vehicle.year} com câmbio {vehicle.transmission}.
    O catálogo deve ser ultra-específico para este modelo exato.
    
    Divida obrigatoriamente nas seguintes categorias e gere o máximo de peças possível para cada uma (mínimo de 6 peças por categoria):
    1. 'Motor e Sistema de alimentação' (Ex: Pistões, bicos injetores, correias, filtros, velas, juntas, bomba de combustível, etc)
    2. 'Transmissão e Embreagem' (Específico para câmbio {vehicle.transmission})
    3. 'Sistema de suspensão' (Amortecedores, bandejas, buchas, pivôs, etc)
    4. 'Sistema de Freios' (Discos, pastilhas, cilindro mestre, ABS, servo freio, etc)
    5. 'Direção' (Caixa de direção, terminais, coluna, bomba hidráulica/elétrica)
    6. 'Sistema Elétrico' (Alternador, motor de arranque, bateria, bobinas, sensores)
    7. 'Sistema de Arrefecimento' (Radiador, bomba d'água, válvula termostática, mangueiras)
    8. 'Acabamento e Carroceria' (Faróis, lanternas, retrovisores, palhetas)

    Para cada peça, inclua:
    - Descrição técnica detalhada.
    - Finalidade específica para este carro.
    - Localização exata no veículo.
    - Problemas comuns relatados por proprietários deste modelo.
    
    IMPORTANTE PARA AS IMAGENS:
    Para o campo 'image_url', use EXCLUSIVAMENTE links reais do Wikimedia Commons (upload.wikimedia.org).
    PROIBIDO: Não use links da Amazon ou Unsplash.
    Se não encontrar um link específico, use este link padrão da Wikimedia para peças: https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Oil_filter_2.jpg/800px-Oil_filter_2.jpg
    
    Retorne APENAS um JSON no seguinte formato:
    {{
        "parts": [
            {{
                "id": increment_id,
                "name": "Nome da Peça",
                "category": "Categoria",
                "subcategory": "Subcategoria",
                "description": "Descrição técnica",
                "image_url": "URL da imagem da peça",
                "details": {{
                    "purpose": "Para que serve especificamente neste carro",
                    "location": "Onde fica localizado neste modelo",
                    "common_problems": "Quais defeitos costumam dar neste modelo de carro"
                }}
            }}
        ]
    }}
    Gere o máximo de peças que conseguir dentro do limite de tokens, priorizando a precisão técnica para o {vehicle.brand} {vehicle.model} {vehicle.year}.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[{"role": "system", "content": "Você é um engenheiro mecânico automotivo sênior especialista em catálogos técnicos."},
                      {"role": "user", "content": prompt}],
            response_format={ "type": "json_object" }
        )
        ai_data = json.loads(response.choices[0].message.content)
        
        # Validar e corrigir imagens da IA
        ai_data = validate_and_fix_images(ai_data, 'parts')
        
        return jsonify({
            'vehicle': f"{vehicle.brand} {vehicle.model} ({vehicle.year}) - {vehicle.transmission}",
            'parts': ai_data['parts']
        }), 200
    except Exception as e:
        print(f"AI Parts Error: {str(e)}. Falling back to static data.")
        return get_vehicle_parts(vehicle_id)

@app.route('/vehicle/checklist/ai/<int:vehicle_id>', methods=['GET'])
def get_vehicle_checklist_ai(vehicle_id):
    vehicle = Vehicle.query.get(vehicle_id)
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404
        
    current_km = vehicle.mileage
    
    # Check if API Key is configured
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here":
        print("OpenAI API Key missing. Falling back to static checklist.")
        return get_vehicle_checklist(vehicle_id)

    prompt = f"""
    Como um mecânico especialista em manutenção preventiva, gere um checklist de manutenção para um {vehicle.brand} {vehicle.model} ano {vehicle.year} com {current_km}km rodados e câmbio {vehicle.transmission}.
    Considere o histórico informado pelo usuário: 
    - Última troca de óleo: {vehicle.last_oil_change}km (há {current_km - vehicle.last_oil_change}km)
    - Última troca de correia: {vehicle.last_belt_change}km (há {current_km - vehicle.last_belt_change}km)
    - Última troca de freios: {vehicle.last_brake_change}km (há {current_km - vehicle.last_brake_change}km)

    Gere um checklist personalizado com o que deve ser feito AGORA ou EM BREVE para este carro específico.

    IMPORTANTE PARA AS IMAGENS:
    Para o campo 'image_url', use EXCLUSIVAMENTE links reais do Wikimedia Commons (upload.wikimedia.org) que mostrem a peça ou o serviço de manutenção.
    PROIBIDO: Nunca use links da Amazon (m.media-amazon.com).
    Se não encontrar um link, use: https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Oil_filter_2.jpg/800px-Oil_filter_2.jpg
    NÃO use links da Amazon, Unsplash ou LoremFlickr.

    Retorne APENAS um JSON no seguinte formato:
    {{
        "checklist": [
            {{
                "id": 1,
                "name": "Nome da Peça/Serviço",
                "description": "Explicação do que deve ser verificado/trocado",
                "reason": "Por que isso é crítico para este modelo/km?",
                "priority": "URGENTE" | "PRÓXIMOS 30 DIAS" | "PRÓXIMOS 60 DIAS" | "PRÓXIMOS 90 DIAS",
                "image_url": "URL da imagem da peça ou serviço"
            }}
        ]
    }}
    Lógica de prioridade:
    - Se ultrapassou o prazo (ex: óleo > 10k km, correia > 50k km): use "URGENTE".
    - Se está perto do prazo: use "PRÓXIMOS 30 DIAS".
    - Se for inspeção de rotina: use "PRÓXIMOS 60 DIAS" ou "90 DIAS".
    Gere pelo menos 8 itens relevantes, incluindo itens específicos do modelo {vehicle.model} e do câmbio {vehicle.transmission}.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[{"role": "system", "content": "Você é um mecânico master de concessionária especialista em manutenção preventiva."},
                      {"role": "user", "content": prompt}],
            response_format={ "type": "json_object" }
        )
        ai_data = json.loads(response.choices[0].message.content)
        
        # Validar e corrigir imagens da IA
        ai_data = validate_and_fix_images(ai_data, 'checklist')

        return jsonify({
            'vehicle': f"{vehicle.brand} {vehicle.model}",
            'mileage': current_km,
            'checklist': ai_data['checklist']
        }), 200
    except Exception as e:
        print(f"AI Checklist Error: {str(e)}. Falling back to static data.")
        return get_vehicle_checklist(vehicle_id)

@app.route('/register', methods=['POST'])
def register():
    print("\n=== NOVO PEDIDO DE REGISTRO ===")
    try:
        data = request.get_json()
        print(f"Dados recebidos: {data}")
    except Exception as e:
        print(f"Erro ao ler JSON: {e}")
        return jsonify({'error': 'Erro ao processar dados JSON'}), 400
        
    if not data:
        print("Erro: Nenhum dado recebido")
        return jsonify({'error': 'Nenhum dado recebido'}), 400
        
    full_name = data.get('full_name')
    email = data.get('email')
    password = data.get('password')
    
    if not all([full_name, email, password]):
        missing = [k for k in ['full_name', 'email', 'password'] if not data.get(k)]
        print(f"Erro: Campos ausentes: {missing}")
        return jsonify({'error': f'Campos obrigatórios ausentes: {", ".join(missing)}'}), 400
    
    try:
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            if existing_user.password == password:
                print(f"Usuário já existe (Login automático): {email}")
                return jsonify({
                    'message': 'Usuário já cadastrado, realizando login automático', 
                    'user': existing_user.to_dict()
                }), 200
            else:
                print(f"Erro: Email já cadastrado com outra senha: {email}")
                return jsonify({'error': 'Este email já está cadastrado com outra senha'}), 400
        
        new_user = User(
            full_name=full_name,
            email=email,
            password=password
        )
        
        db.session.add(new_user)
        db.session.commit()
        print(f"Usuário criado com sucesso: {email}")
        return jsonify({'message': 'User registered successfully', 'user': new_user.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Erro de banco de dados: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing credentials'}), 400
    
    user = User.query.filter_by(email=data['email'], password=data['password']).first()
    
    if user:
        return jsonify({'message': 'Login successful', 'user': user.to_dict()}), 200
    else:
        return jsonify({'error': 'Invalid email or password'}), 401

@app.route('/vehicle/maintenance/<int:maintenance_id>', methods=['DELETE'])
def delete_maintenance(maintenance_id):
    print(f"\n=== EXCLUINDO REGISTRO DE MANUTENÇÃO ID: {maintenance_id} ===")
    try:
        entry = MaintenanceHistory.query.get(maintenance_id)
        if not entry:
            return jsonify({'error': 'Registro não encontrado'}), 404
            
        db.session.delete(entry)
        db.session.commit()
        print("Registro excluído com sucesso!")
        return jsonify({'message': 'Registro excluído com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao excluir: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/vehicle/parts/<int:vehicle_id>', methods=['GET'])
def get_vehicle_parts(vehicle_id):
    vehicle = Vehicle.query.get(vehicle_id)
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404
        
    transmission_type = vehicle.transmission.lower() if vehicle.transmission else 'manual'
    is_automatic = 'autom' in transmission_type
    
    parts_catalog = []
    
    # --- Peças de Motor (Comum a todos) ---
    parts_catalog.extend([
        {
            'id': 1,
            'name': 'Filtro de Óleo',
            'category': 'Motor e Sistema de alimentação',
            'subcategory': 'Lubrificação',
            'description': f'Filtro de alta eficiência para {vehicle.brand} {vehicle.model}.',
            'details': {
                'purpose': 'Reter impurezas do óleo lubrificante.',
                'location': 'Bloco do motor.',
                'common_problems': 'Obstrução por falta de troca, causando queda de pressão.'
            },
            'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Oil_filter_2.jpg/800px-Oil_filter_2.jpg'
        },
        {
            'id': 2,
            'name': 'Velas de Ignição',
            'category': 'Motor e Sistema de alimentação',
            'subcategory': 'Ignição',
            'description': f'Conjunto de velas originais para {vehicle.brand}.',
            'details': {
                'purpose': 'Gerar a centelha para combustão.',
                'location': 'Cabeçote do motor.',
                'common_problems': 'Dificuldade na partida e alto consumo.'
            },
            'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Sparkplug.jpg/800px-Sparkplug.jpg'
        }
    ])

    # --- Peças de Transmissão (Depende do Câmbio) ---
    if is_automatic:
        parts_catalog.extend([
            {
                'id': 104,
                'name': 'Conversor de Torque',
                'category': 'Transmissão e Embreagem',
                'subcategory': f'Automático ({vehicle.transmission})',
                'description': f'Acoplamento fluído para o câmbio automático do {vehicle.model}.',
                'details': {
                    'purpose': 'Transmitir o torque do motor para a caixa sem embreagem mecânica.',
                    'location': 'Entre o motor e a transmissão.',
                    'common_problems': 'Patinamento ou vibração excessiva.'
                },
                'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Torque_converter.jpg/800px-Torque_converter.jpg'
            },
            {
                'id': 105,
                'name': 'Corpo de Válvulas',
                'category': 'Transmissão e Embreagem',
                'subcategory': f'Automático ({vehicle.transmission})',
                'description': 'Cérebro hidráulico da transmissão automática.',
                'details': {
                    'purpose': 'Controlar o fluxo de fluído para as trocas de marcha.',
                    'location': 'Interior da caixa de câmbio.',
                    'common_problems': 'Trancos ou atrasos nas trocas.'
                },
                'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Hydraulic_valve_block.jpg/800px-Hydraulic_valve_block.jpg'
            }
        ])
    else:
        parts_catalog.extend([
            {
                'id': 100,
                'name': 'Kit de Embreagem',
                'category': 'Transmissão e Embreagem',
                'subcategory': 'Manual',
                'description': f'Kit completo (platô, disco e rolamento) para {vehicle.brand}.',
                'details': {
                    'purpose': 'Acoplamento e desacoplamento do motor com o câmbio.',
                    'location': 'Entre o motor e a caixa de câmbio.',
                    'common_problems': 'Embreagem "patinando" ou pedal pesado.'
                },
                'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Clutch_plate.jpg/800px-Clutch_plate.jpg'
            }
        ])

    # --- Peças de Suspensão e Freios (Comum) ---
    parts_catalog.extend([
        {
            'id': 200,
            'name': 'Pastilhas de Freio Dianteiras',
            'category': 'Sistema de Freios',
            'subcategory': 'Frenagem',
            'description': f'Pastilhas cerâmicas de alta durabilidade para {vehicle.model}.',
            'details': {
                'purpose': 'Gerar atrito com o disco para parar o veículo.',
                'location': 'Pinças de freio dianteiras.',
                'common_problems': 'Ruído metálico (aviso de desgaste).'
            },
            'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Brake_pad.jpg/800px-Brake_pad.jpg'
        },
        {
            'id': 300,
            'name': 'Amortecedores Dianteiros',
            'category': 'Sistema de suspensão',
            'subcategory': 'Amortecimento',
            'description': f'Amortecedores pressurizados para {vehicle.brand}.',
            'details': {
                'purpose': 'Controlar as oscilações da mola e manter o pneu no chão.',
                'location': 'Torres de suspensão dianteiras.',
                'common_problems': 'Vazamento de óleo ou perda de ação.'
            },
            'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/MacPherson_strut.jpg/800px-MacPherson_strut.jpg'
        }
    ])
    
    return jsonify({
        'vehicle': f"{vehicle.brand} {vehicle.model} ({vehicle.year}) - {vehicle.transmission}",
        'parts': parts_catalog
    }), 200

if __name__ == '__main__':
    create_tables()
    app.run(host='0.0.0.0', port=5000, debug=True)
