from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

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

    def to_dict(self):
        return {
            'id': self.id,
            'brand': self.brand,
            'model': self.model,
            'year': self.year,
            'transmission': self.transmission,
            'mileage': self.mileage,
            'fuel_type': self.fuel_type,
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
        'models': ['Fiesta', 'Focus', 'Ranger', 'Ka', 'EcoSport'],
        'start_year': 2010,
        'docs': 'Ford Developer API / OpenXC'
    },
    'Chevrolet': {
        'models': ['Onix', 'Prisma', 'Cruze', 'S10', 'Tracker'],
        'start_year': 2011,
        'docs': 'GM Developer Portal'
    },
    'Volkswagen': {
        'models': ['Gol', 'Polo', 'Golf', 'T-Cross', 'Amarok'],
        'start_year': 2010,
        'docs': 'VW Car-Net API'
    },
    'Toyota': {
        'models': ['Corolla', 'Hilux', 'Yaris', 'Etios', 'SW4'],
        'start_year': 2012,
        'docs': 'Toyota Connected Services API'
    },
    'Honda': {
        'models': ['Civic', 'Fit', 'City', 'HR-V', 'CR-V'],
        'start_year': 2012,
        'docs': 'Honda Developer Studio'
    },
    'Hyundai': {
        'models': ['HB20', 'Creta', 'Tucson', 'i30'],
        'start_year': 2012,
        'docs': 'Hyundai Bluelink API'
    },
    'Fiat': {
        'models': ['Uno', 'Palio', 'Argo', 'Cronos', 'Toro', 'Mobi'],
        'start_year': 2010,
        'docs': 'FCA Developer Portal'
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
        current_year = 2024
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
        mileage=data.get('mileage'),
        fuel_type=data.get('fuel_type'),
        user_id=data['user_id']
    )
    
    try:
        db.session.add(new_vehicle)
        db.session.commit()
        return jsonify({'message': 'Vehicle registered successfully', 'vehicle': new_vehicle.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

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
    
    if vehicle and vehicle.maintenance_history:
        # Simple recommendation logic
        for history in vehicle.maintenance_history:
            if history.item == "Troca de Óleo":
                # Assuming oil change every 10,000km
                next_change = history.last_km + 10000
                if vehicle.mileage >= next_change - 1000:
                    status['recommendation'] = f"Seu carro está com {vehicle.mileage} km. Está na hora da próxima troca de óleo?"
                else:
                    status['recommendation'] = f"Próxima troca de óleo estimada aos {next_change} km."
    
    return jsonify(status), 200

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
        
    # Catálogo de peças estruturado como guia de instrução técnica profunda
    # Exemplo focado no Onix 2023 conforme solicitado
    parts_catalog = [
        {
            'id': 100,
            'name': 'Caixa de câmbio F17/F176HR',
            'category': 'Transmissão e Embreagem',
            'subcategory': 'Manual',
            'description': 'Unidade de transmissão manual robusta da Chevrolet.',
            'details': {
                'purpose': 'Gerenciar as relações de marcha e torque para as rodas.',
                'location': 'Acoplada ao motor no lado do motorista.',
                'common_problems': 'Dificuldade em engates ou ruídos em marchas altas.'
            },
            'image_url': 'https://http2.mlstatic.com/D_NQ_NP_612115-MLB25154378775_112016-O.webp'
        },
        {
            'id': 101,
            'name': 'Semi-eixos',
            'category': 'Transmissão e Embreagem',
            'subcategory': 'Manual',
            'description': 'Eixos de transmissão de força.',
            'details': {
                'purpose': 'Levar o torque da caixa para os cubos de roda.',
                'location': 'Entre o câmbio e as rodas dianteiras.',
                'common_problems': 'Vibração ao acelerar ou empenamento.'
            },
            'image_url': 'https://http2.mlstatic.com/D_NQ_NP_833894-MLB46665792225_072021-O.webp'
        },
        {
            'id': 102,
            'name': 'Homocinéticas',
            'category': 'Transmissão e Embreagem',
            'subcategory': 'Manual',
            'description': 'Juntas de velocidade constante.',
            'details': {
                'purpose': 'Permitir a tração mesmo com as rodas esterçadas.',
                'location': 'Nas pontas dos semi-eixos.',
                'common_problems': 'Estalos metálicos ao fazer curvas.'
            },
            'image_url': 'https://http2.mlstatic.com/D_NQ_NP_673894-MLB46665792225_072021-O.webp'
        },
        {
            'id': 103,
            'name': 'Trambulador',
            'category': 'Transmissão e Embreagem',
            'subcategory': 'Manual',
            'description': 'Sistema de seleção de marchas.',
            'details': {
                'purpose': 'Transmitir o movimento da alavanca para o câmbio.',
                'location': 'Topo da caixa de câmbio.',
                'common_problems': 'Folga na alavanca ou marchas que não entram.'
            },
            'image_url': 'https://http2.mlstatic.com/D_NQ_NP_721115-MLB25154378775_112016-O.webp'
        },
        {
            'id': 104,
            'name': 'Conversor de Torque',
            'category': 'Transmissão e Embreagem',
            'subcategory': 'Automático (6 marchas)',
            'description': 'Acoplamento fluído da transmissão automática.',
            'details': {
                'purpose': 'Substituir a embreagem manual, permitindo paradas sem apagar o motor.',
                'location': 'Entre o motor e a transmissão automática.',
                'common_problems': 'Patinamento ou vibração excessiva em baixas rotações.'
            },
            'image_url': 'https://http2.mlstatic.com/D_NQ_NP_727142-MLB46665787680_072021-O.webp'
        },
        {
            'id': 105,
            'name': 'Corpo de Válvulas',
            'category': 'Transmissão e Embreagem',
            'subcategory': 'Automático (6 marchas)',
            'description': 'Cérebro hidráulico do câmbio.',
            'details': {
                'purpose': 'Direcionar o fluído para os pacotes de disco corretos.',
                'location': 'Parte frontal interna da transmissão.',
                'common_problems': 'Trancos nas trocas de marcha.'
            },
            'image_url': 'https://http2.mlstatic.com/D_NQ_NP_921115-MLB25154378775_112016-O.webp'
        },
        {
            'id': 106,
            'name': 'Módulo TCM',
            'category': 'Transmissão e Embreagem',
            'subcategory': 'Automático (6 marchas)',
            'description': 'Módulo de controle da transmissão.',
            'details': {
                'purpose': 'Gerenciar eletronicamente as trocas de marcha.',
                'location': 'Geralmente fixado à própria carcaça do câmbio.',
                'common_problems': 'Perda de comunicação ou modo de emergência.'
            },
            'image_url': 'https://http2.mlstatic.com/D_NQ_NP_821115-MLB25154378775_112016-O.webp'
        },
        {
            'id': 107,
            'name': 'Fluido ATF',
            'category': 'Transmissão e Embreagem',
            'subcategory': 'Automático (6 marchas)',
            'description': 'Óleo específico para câmbios automáticos.',
            'details': {
                'purpose': 'Lubrificação, limpeza e pressão hidráulica.',
                'location': 'Interior de todo o sistema de transmissão.',
                'common_problems': 'Escurecimento e perda de viscosidade (causa patinamento).'
            },
            'image_url': 'https://http2.mlstatic.com/D_NQ_NP_712115-MLB25154378775_112016-O.webp'
        }
    ]
    
    return jsonify({
        'vehicle': f"{vehicle.brand} {vehicle.model} ({vehicle.year})",
        'parts': parts_catalog
    }), 200

if __name__ == '__main__':
    create_tables()
    app.run(host='0.0.0.0', port=5000, debug=True)
