from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///amp_db.db'
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
    
    vehicle = db.relationship('Vehicle', backref=db.backref('maintenance_history', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'item': self.item,
            'last_km': self.last_km,
            'last_date': self.last_date
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
        db.create_all()

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
    data = request.json
    if not data or not data.get('vehicle_id') or not data.get('history'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        for entry in data['history']:
            new_entry = MaintenanceHistory(
                vehicle_id=data['vehicle_id'],
                item=entry['item'],
                last_km=entry['last_km'],
                last_date=entry.get('last_date')
            )
            db.session.add(new_entry)
        
        db.session.commit()
        return jsonify({'message': 'Maintenance history saved successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

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
    print("--- New Register Request ---")
    print(f"Content-Type: {request.content_type}")
    try:
        data = request.get_json()
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        return jsonify({'error': 'Erro ao processar dados JSON'}), 400
        
    print(f"Data received: {data}")
    
    if not data:
        return jsonify({'error': 'Nenhum dado recebido'}), 400
        
    full_name = data.get('full_name')
    email = data.get('email')
    password = data.get('password')
    
    if not all([full_name, email, password]):
        missing = [k for k in ['full_name', 'email', 'password'] if not data.get(k)]
        return jsonify({'error': f'Campos obrigatórios ausentes: {", ".join(missing)}'}), 400
    
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        if existing_user.password == password:
            # Auto-login if user already exists with same password
            return jsonify({
                'message': 'Usuário já cadastrado, realizando login automático', 
                'user': existing_user.to_dict()
            }), 200
        else:
            return jsonify({'error': 'Este email já está cadastrado com outra senha'}), 400
    
    new_user = User(
        full_name=full_name,
        email=email,
        password=password
    )
    
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'User registered successfully', 'user': new_user.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
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

if __name__ == '__main__':
    create_tables()
    app.run(host='0.0.0.0', port=5000, debug=True)
