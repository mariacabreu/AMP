from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
import json
import sys
import threading

# Configure Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# OpenAI setup (optional)
try:
    from openai import OpenAI
    from dotenv import load_dotenv
    load_dotenv()
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
except Exception:
    client = None
    print("[AMP] OpenAI indisponível - usando fallback estático")

# Database configuration - Android-safe
db_path = None
if hasattr(sys, 'getandroidapilevel'):
    # Running on Android, use internal app storage
    try:
        from android.os import Environment
        import android
        app_context = android.get_context()
        db_dir = app_context.getFilesDir().getAbsolutePath()
        db_path = os.path.join(db_dir, 'amp_db.db')
        print(f"[AMP] Banco de dados Android: {db_path}")
    except Exception as e:
        print(f"[AMP] Erro ao configurar diretório Android: {e}")
        # Fallback para diretório temporário
        import tempfile
        temp_dir = tempfile.gettempdir()
        db_path = os.path.join(temp_dir, 'amp_db.db')
        print(f"[AMP] Usando fallback temp: {db_path}")
else:
    # Desktop fallback
    basedir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(basedir, 'amp_db.db')
    print(f"[AMP] Banco de dados desktop: {db_path}")

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + db_path
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = False  # Desativa logs para produção

# Initialize SQLAlchemy
db = SQLAlchemy(app)

# User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    is_premium = db.Column(db.Boolean, default=False)
    reminder_frequency = db.Column(db.String(50), default='biweekly')
    vehicles = db.relationship('Vehicle', backref='owner', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'is_premium': self.is_premium,
            'reminder_frequency': self.reminder_frequency
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
    engine_type = db.Column(db.String(50))
    usage_type = db.Column(db.String(50))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
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
            'engine_type': self.engine_type,
            'usage_type': self.usage_type,
            'last_oil_change': self.last_oil_change,
            'last_belt_change': self.last_belt_change,
            'last_brake_change': self.last_brake_change,
            'maintenance_history': [h.to_dict() for h in self.maintenance_history]
        }

# Maintenance History Model
class MaintenanceHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicle.id'), nullable=False)
    item = db.Column(db.String(100), nullable=False)
    last_km = db.Column(db.Integer, nullable=False)
    last_date = db.Column(db.String(20))
    cost = db.Column(db.Float, default=0.0)
    liters = db.Column(db.Float, default=0.0)
    
    vehicle = db.relationship('Vehicle', backref=db.backref('maintenance_history', lazy=True, cascade='all, delete-orphan'))

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
        'engines': {
            'Fiesta': ['1.0 Rocam', '1.6 Rocam', '1.0 EcoBoost', '1.5 Sigma'],
            'Focus': ['1.6 Sigma', '2.0 Duratec', '2.0 GDI'],
            'Ranger': ['2.2 Diesel', '3.2 Diesel', '2.5 Flex'],
            'Ka': ['1.0 Rocam', '1.5 Sigma'],
            'EcoSport': ['1.5 Sigma', '1.6 Rocam', '2.0 Duratec', '1.0 EcoBoost'],
            'Fusion': ['2.0 Duratec', '2.0 EcoBoost', '2.5 Hybrid'],
            'Edge': ['2.0 EcoBoost', '3.5 V6'],
            'Mustang': ['2.3 EcoBoost', '5.0 V8'],
            'Territory': ['1.5 EcoBoost', '2.0 EcoBoost'],
            'Bronco': ['2.0 EcoBoost', '2.3 EcoBoost', '2.7 V6 EcoBoost']
        },
        'start_year': 2010,
        'docs': 'Ford Developer API / OpenXC'
    },
    'Chevrolet': {
        'models': ['Onix', 'Prisma', 'Cruze', 'S10', 'Tracker', 'Spin', 'Montana', 'Equinox', 'Trailblazer', 'Camaro'],
        'engines': {
            'Onix': ['1.0 Aspirado', '1.0 Turbo', '1.4 Aspirado'],
            'S10': ['2.4 Flex', '2.5 Flex', '2.8 Diesel'],
            'Prisma': ['1.0 Aspirado', '1.4 Aspirado'],
            'Cruze': ['1.4 Turbo', '1.8 Aspirado', '2.0 Diesel'],
            'Tracker': ['1.0 Turbo', '1.2 Turbo', '1.4 Turbo'],
            'Spin': ['1.8 Aspirado', '1.8 Flex'],
            'Montana': ['1.4 Aspirado', '1.8 Aspirado'],
            'Equinox': ['1.5 Turbo', '2.0 Turbo'],
            'Trailblazer': ['2.8 Diesel', '3.6 V6'],
            'Camaro': ['2.0 Turbo', '3.6 V6', '6.2 V6']
        },
        'start_year': 2011,
        'docs': 'GM Developer Portal'
    },
    'Volkswagen': {
        'models': ['Gol', 'Polo', 'Golf', 'T-Cross', 'Amarok', 'Virtus', 'Nivus', 'Taos', 'Jetta', 'Tiguan', 'Voyage', 'Saveiro'],
        'engines': {
            'Polo': ['1.0 MPI', '1.6 MSI', '1.0 TSI (200 TSI)', '1.4 TSI (GTS)'],
            'Golf': ['1.4 TSI', '2.0 TSI (GTI)', '1.6 MSI'],
            'T-Cross': ['1.0 TSI (200 TSI)', '1.4 TSI (250 TSI)'],
            'Gol': ['1.0 MPI', '1.6 MSI', '1.0 TSI'],
            'Amarok': ['2.0 Diesel', '3.0 V6 Diesel'],
            'Virtus': ['1.0 MPI', '1.6 MSI', '1.0 TSI'],
            'Nivus': ['1.0 TSI (200 TSI)', '1.4 TSI'],
            'Taos': ['1.4 TSI', '2.0 TSI'],
            'Jetta': ['1.4 TSI', '2.0 TSI', '2.0 Diesel'],
            'Tiguan': ['1.4 TSI', '2.0 TSI'],
            'Voyage': ['1.0 MPI', '1.6 MSI'],
            'Saveiro': ['1.6 MSI']
        },
        'start_year': 2010,
        'docs': 'VW Car-Net API'
    },
    'Toyota': {
        'models': ['Corolla', 'Hilux', 'Yaris', 'Etios', 'SW4', 'Rav4', 'Camry', 'Prius', 'Corolla Cross'],
        'engines': {
            'Corolla': ['1.8 Hybrid', '2.0 Dynamic Force', '1.8 Dual VVT-i', '2.0 Dual VVT-i'],
            'Hilux': ['2.7 Flex', '2.8 Diesel', '3.0 Diesel'],
            'Yaris': ['1.3 Dual VVT-i', '1.5 Dual VVT-i'],
            'Etios': ['1.3 Dual VVT-i', '1.5 Dual VVT-i'],
            'SW4': ['2.7 Flex', '2.8 Diesel', '4.0 V6'],
            'Rav4': ['2.0 Dynamic Force', '2.5 Hybrid'],
            'Camry': ['2.5 Hybrid', '3.5 V6'],
            'Prius': ['1.8 Hybrid'],
            'Corolla Cross': ['1.8 Hybrid', '2.0 Dynamic Force']
        },
        'start_year': 2012,
        'docs': 'Toyota Connected Services API'
    },
    'Honda': {
        'models': ['Civic', 'Fit', 'City', 'HR-V', 'CR-V', 'WR-V', 'Accord'],
        'engines': {
            'Civic': ['2.0 i-VTEC', '1.5 Turbo', '1.8 i-VTEC'],
            'HR-V': ['1.8 i-VTEC', '1.5 Turbo'],
            'Fit': ['1.3 i-VTEC', '1.5 i-VTEC'],
            'City': ['1.5 i-VTEC'],
            'CR-V': ['1.5 Turbo', '2.0 i-VTEC', '2.0 Hybrid'],
            'WR-V': ['1.5 i-VTEC'],
            'Accord': ['1.5 Turbo', '2.0 Hybrid', '2.0 Turbo']
        },
        'start_year': 2012,
        'docs': 'Honda Developer Studio'
    },
    'Hyundai': {
        'models': ['HB20', 'Creta', 'Tucson', 'i30', 'Santa Fe', 'Azera', 'Elantra', 'Ix35'],
        'engines': {
            'HB20': ['1.0 Aspirado', '1.0 Turbo (TGDI)', '1.6 Aspirado'],
            'Creta': ['1.6 Aspirado', '2.0 Aspirado', '1.0 Turbo (TGDI)', '2.0 Smartstream'],
            'i30': ['1.6 Gamma', '2.0 Nu', '1.6 Turbo GDI', '1.8 Nu'],
            'Tucson': ['1.6 Turbo GDI', '2.0 Nu', '2.0 Diesel', '1.6 Hybrid'],
            'Santa Fe': ['2.0 Turbo GDI', '2.2 Diesel', '3.5 V6'],
            'Azera': ['3.0 V6', '3.3 V6'],
            'Elantra': ['1.6 Gamma', '2.0 Nu', '1.6 Turbo'],
            'Ix35': ['2.0 Nu', '2.4 Theta II', '2.0 Diesel']
        },
        'start_year': 2012,
        'docs': 'Hyundai Bluelink API'
    },
    'Fiat': {
        'models': ['Uno', 'Palio', 'Argo', 'Cronos', 'Toro', 'Mobi', 'Strada', 'Fastback', 'Pulse', 'Fiorino', 'Siena'],
        'engines': {
            'Pulse': ['1.3 Firefly', '1.0 Turbo 200', '1.3 Turbo 270 (Abarth)'],
            'Fastback': ['1.0 Turbo 200', '1.3 Turbo 270'],
            'Argo': ['1.0 Firefly', '1.3 Firefly', '1.8 E.torQ'],
            'Cronos': ['1.3 Firefly', '1.8 E.torQ'],
            'Toro': ['1.8 E.torQ', '2.4 Tigershark', '2.0 Diesel', '1.3 Turbo 270'],
            'Strada': ['1.4 Fire', '1.6 E.torQ'],
            'Mobi': ['1.0 Fire'],
            'Uno': ['1.0 Fire', '1.3 Firefly'],
            'Palio': ['1.0 Fire', '1.4 Fire', '1.6 E.torQ'],
            'Fiorino': ['1.4 Fire'],
            'Siena': ['1.4 Fire', '1.6 E.torQ']
        },
        'model_start_years': {
            'Pulse': 2021,
            'Fastback': 2022,
            'Argo': 2017,
            'Cronos': 2018,
            'Mobi': 2016,
            'Toro': 2016,
            'Strada': 2010
        },
        'start_year': 2010,
        'docs': 'FCA Developer Portal'
    },
    'Renault': {
        'models': ['Sandero', 'Logan', 'Duster', 'Kwid', 'Oroch', 'Captur', 'Master', 'Stepway'],
        'engines': {
            'Duster': ['1.6 SCe', '2.0 Hi-Flex', '1.3 Turbo TCe'],
            'Sandero': ['1.0 SCe', '1.6 SCe', '2.0 (R.S.)'],
            'Logan': ['1.0 SCe', '1.6 SCe'],
            'Kwid': ['1.0 SCe'],
            'Oroch': ['1.6 SCe', '2.0 Hi-Flex'],
            'Captur': ['1.3 Turbo TCe', '1.6 SCe'],
            'Master': ['2.3 Diesel']
        },
        'start_year': 2012,
        'docs': 'Renault Connected Services'
    },
    'Jeep': {
        'models': ['Renegade', 'Compass', 'Commander', 'Wrangler', 'Cherokee'],
        'engines': {
            'Renegade': ['1.8 E.torQ', '2.0 Diesel', '1.3 Turbo 270'],
            'Compass': ['2.0 Flex', '2.0 Diesel', '1.3 Turbo 270', '1.3 Turbo Hybrid (4xe)'],
            'Commander': ['1.3 Turbo 270', '2.0 Diesel'],
            'Wrangler': ['2.0 Turbo', '3.6 V6', '2.0 Diesel'],
            'Cherokee': ['2.4 Tigershark', '2.0 Turbo', '3.2 V6']
        },
        'start_year': 2015,
        'docs': 'FCA Developer Portal'
    },
    'Nissan': {
        'models': ['March', 'Versa', 'Kicks', 'Frontier', 'Sentra', 'Leaf'],
        'engines': {
            'Kicks': ['1.6 16V Flex'],
            'Frontier': ['2.3 Diesel Turbo', '2.3 Diesel Bi-Turbo', '2.5 Diesel'],
            'March': ['1.0 12V', '1.6 16V'],
            'Versa': ['1.0 12V', '1.6 16V'],
            'Sentra': ['2.0 16V', '1.6 Turbo'],
            'Leaf': ['Elétrico']
        },
        'start_year': 2012,
        'docs': 'Nissan Connect API'
    },
    'Mitsubishi': {
        'models': ['L200', 'Pajero', 'ASX', 'Eclipse Cross', 'Outlander'],
        'engines': {
            'L200': ['2.4 Diesel', '3.2 Diesel', '3.5 Flex'],
            'ASX': ['2.0 MIVEC Flex'],
            'Pajero': ['3.2 Diesel', '3.8 V6'],
            'Eclipse Cross': ['1.5 Turbo', '2.4 Hybrid'],
            'Outlander': ['2.4 MIVEC', '2.4 Hybrid']
        },
        'start_year': 2010,
        'docs': 'Mitsubishi Motors API'
    },
    'Peugeot': {
        'models': ['208', '2008', '3008', '5008', 'Partner', 'Expert'],
        'engines': {
            '208': ['1.2 PureTech', '1.6 Flex', '1.0 Firefly'],
            '3008': ['1.6 THP', '2.0 Diesel', '1.2 PureTech'],
            '2008': ['1.2 PureTech', '1.6 THP'],
            '5008': ['1.2 PureTech', '1.6 THP', '2.0 Diesel'],
            'Partner': ['1.6 HDi', '1.6 THP'],
            'Expert': ['2.0 Diesel']
        },
        'start_year': 2015,
        'docs': 'PSA Group API'
    },
    'Citroën': {
        'models': ['C3', 'C4 Cactus', 'C4 Lounge', 'Berlingo', 'Jumpy'],
        'engines': {
            'C3': ['1.2 PureTech', '1.6 Flex', '1.0 Firefly'],
            'C4 Cactus': ['1.6 Flex', '1.6 THP'],
            'C4 Lounge': ['1.6 THP', '2.0 Diesel'],
            'Berlingo': ['1.6 HDi'],
            'Jumpy': ['2.0 Diesel']
        },
        'start_year': 2015,
        'docs': 'PSA Group API'
    },
    'BMW': {
        'models': ['Série 3', 'Série 1', 'X1', 'X3', 'X5', 'Série 5'],
        'engines': {
            'Série 3': ['2.0 Turbo (320i)', '3.0 Turbo (M340i)', '2.0 Hybrid (330e)'],
            'Série 1': ['1.5 Turbo', '2.0 Turbo'],
            'X1': ['1.5 Turbo', '2.0 Turbo'],
            'X3': ['2.0 Turbo', '3.0 Turbo'],
            'X5': ['3.0 Turbo', '4.4 V8 Turbo'],
            'Série 5': ['2.0 Turbo', '3.0 Turbo', '3.0 Hybrid']
        },
        'start_year': 2014,
        'docs': 'BMW ConnectedDrive API'
    },
    'Mercedes-Benz': {
        'models': ['Classe A', 'Classe C', 'GLA', 'GLC', 'GLE', 'Classe E'],
        'engines': {
            'Classe C': ['1.5 Turbo', '1.6 Turbo', '2.0 Turbo'],
            'Classe A': ['1.3 Turbo', '2.0 Turbo'],
            'GLA': ['1.3 Turbo', '2.0 Turbo'],
            'GLC': ['2.0 Turbo', '3.0 Turbo'],
            'GLE': ['2.0 Turbo', '3.0 Turbo', '3.0 Diesel'],
            'Classe E': ['1.5 Turbo', '2.0 Turbo', '3.0 Turbo']
        },
        'start_year': 2014,
        'docs': 'Mercedes-Benz Developers'
    },
    'Audi': {
        'models': ['A3', 'A4', 'Q3', 'Q5', 'A5', 'Q7'],
        'engines': {
            'A3': ['1.4 TFSI', '2.0 TFSI'],
            'Q3': ['1.4 TFSI', '2.0 TFSI'],
            'A4': ['2.0 TFSI', '3.0 TFSI'],
            'Q5': ['2.0 TFSI', '3.0 TFSI'],
            'A5': ['2.0 TFSI', '3.0 TFSI'],
            'Q7': ['3.0 TFSI', '3.0 TDI']
        },
        'start_year': 2014,
        'docs': 'Audi API Portal'
    },
    'Kia': {
        'models': ['Sportage', 'Cerato', 'Sorento', 'Rio', 'Picanto', 'Stonic', 'Niro'],
        'engines': {
            'Sportage': ['2.0 Flex', '1.6 Turbo Hybrid'],
            'Cerato': ['1.6 Flex', '2.0 Flex'],
            'Sorento': ['2.2 Diesel', '2.5 Turbo'],
            'Rio': ['1.0 MPI', '1.6 MPI'],
            'Picanto': ['1.0 MPI'],
            'Stonic': ['1.0 MPI', '1.0 Turbo'],
            'Niro': ['1.6 Hybrid', '1.6 Plug-in Hybrid']
        },
        'start_year': 2012,
        'docs': 'Kia Connect API'
    },
    'Chery': {
        'models': ['Tiggo 2', 'Tiggo 5X', 'Tiggo 7', 'Tiggo 8', 'Arrizo 5', 'Arrizo 6'],
        'engines': {
            'Tiggo 5X': ['1.5 Turbo Flex'],
            'Tiggo 8': ['1.6 Turbo GDI'],
            'Tiggo 2': ['1.5 Aspirado', '1.5 Turbo'],
            'Tiggo 7': ['1.5 Turbo', '1.6 Turbo GDI'],
            'Arrizo 5': ['1.5 Aspirado'],
            'Arrizo 6': ['1.5 Turbo']
        },
        'start_year': 2018,
        'docs': 'Caoa Chery API'
    }
}

# Create database and tables (handled by create_tables_safe() on server startup)

@app.route('/vehicle/brands', methods=['GET'])
def get_brands():
    return jsonify(list(SUPPORTED_BRANDS.keys())), 200

@app.route('/vehicle/models/<brand>', methods=['GET'])
def get_models(brand):
    if brand in SUPPORTED_BRANDS:
        return jsonify(SUPPORTED_BRANDS[brand]['models']), 200
    return jsonify({'error': 'Marca não suportada'}), 404

@app.route('/vehicle/engines/<brand>/<model>', methods=['GET'])
def get_engines(brand, model):
    if brand in SUPPORTED_BRANDS:
        brand_data = SUPPORTED_BRANDS[brand]
        if 'engines' in brand_data and model in brand_data['engines']:
            return jsonify(brand_data['engines'][model]), 200
        return jsonify(['1.0', '1.4', '1.6', '1.8', '2.0', '2.0 Turbo']), 200
    return jsonify({'error': 'Marca não suportada'}), 404

@app.route('/vehicle/years/<brand>/<model>', methods=['GET'])
def get_years(brand, model):
    if brand in SUPPORTED_BRANDS:
        brand_data = SUPPORTED_BRANDS[brand]
        current_year = 2026
        
        start_year = brand_data.get('start_year', 2010)
        if 'model_start_years' in brand_data and model in brand_data['model_start_years']:
            start_year = brand_data['model_start_years'][model]
            
        years = list(range(current_year, start_year - 1, -1))
        return jsonify(years), 200
    return jsonify({'error': 'Marca não suportada'}), 404

@app.route('/vehicle/<int:vehicle_id>', methods=['GET', 'PUT', 'PATCH'])
def get_or_update_vehicle(vehicle_id):
    if request.method == 'GET':
        vehicle = Vehicle.query.get(vehicle_id)
        if not vehicle:
            return jsonify({'error': 'Veículo não encontrado'}), 404
        return jsonify(vehicle.to_dict()), 200
    
    print(f"\n=== ATUALIZANDO VEÍCULO ID: {vehicle_id} ===")
    data = request.json
    print(f"Dados recebidos para atualização: {data}")
    
    vehicle = Vehicle.query.get(vehicle_id)
    if not vehicle:
        return jsonify({'error': 'Veículo não encontrado'}), 404
    
    try:
        if 'mileage' in data:
            vehicle.mileage = data['mileage']
        if 'last_oil_change' in data:
            vehicle.last_oil_change = data['last_oil_change']
        if 'last_belt_change' in data:
            vehicle.last_belt_change = data['last_belt_change']
        if 'last_brake_change' in data:
            vehicle.last_brake_change = data['last_brake_change']
        if 'transmission' in data:
            vehicle.transmission = data['transmission']
        if 'fuel_type' in data:
            vehicle.fuel_type = data['fuel_type']
        if 'engine_type' in data:
            vehicle.engine_type = data['engine_type']
        if 'usage_type' in data:
            vehicle.usage_type = data['usage_type']
        
        db.session.commit()
        print("Veículo atualizado com sucesso!")
        return jsonify({
            'message': 'Veículo atualizado com sucesso', 
            'vehicle': vehicle.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao atualizar veículo: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/vehicle/register', methods=['POST'])
def register_vehicle():
    data = request.json
    if not data or not all(k in data for k in ('brand', 'model', 'year', 'user_id')):
        return jsonify({'error': 'Campos obrigatórios ausentes'}), 400
    
    if data['brand'] not in SUPPORTED_BRANDS:
        return jsonify({'error': 'Marca não compatível com OBD-II Bluetooth'}), 400
    
    brand_data = SUPPORTED_BRANDS[data['brand']]
    if data['model'] not in brand_data['models']:
        return jsonify({'error': 'Modelo não compatível com OBD-II Bluetooth'}), 400
    
    model_start_year = brand_data.get('model_start_years', {}).get(data['model'], brand_data.get('start_year', 2010))
    current_year = 2026
    if data['year'] < model_start_year or data['year'] > current_year:
        return jsonify({'error': f'Ano {data["year"]} não é válido para {data["brand"]} {data["model"]}. Anos disponíveis: {model_start_year} - {current_year}'}), 400
    
    new_vehicle = Vehicle(
        brand=data['brand'],
        model=data['model'],
        year=data['year'],
        transmission=data.get('transmission'),
        mileage=data.get('mileage', 0),
        fuel_type=data.get('fuel_type'),
        engine_type=data.get('engine_type'),
        usage_type=data.get('usage_type'),
        user_id=data['user_id'],
        last_oil_change=data.get('last_oil_change', 0),
        last_belt_change=data.get('last_belt_change', 0),
        last_brake_change=data.get('last_brake_change', 0)
    )
    
    try:
        db.session.add(new_vehicle)
        db.session.commit()
        return jsonify({'message': 'Veículo registrado com sucesso', 'vehicle': new_vehicle.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/vehicle/checklist/<int:vehicle_id>', methods=['GET'])
def get_vehicle_checklist(vehicle_id):
    vehicle = Vehicle.query.get(vehicle_id)
    if not vehicle:
        return jsonify({'error': 'Veículo não encontrado'}), 404
        
    current_km = vehicle.mileage or 0
    checklist = []
    item_id = 1
    
    oil_diff = current_km - (vehicle.last_oil_change or 0)
    if oil_diff >= 9000:
        checklist.append({
            'id': item_id,
            'name': 'Troca de Óleo e Filtro de Óleo',
            'description': f'Já se passaram {oil_diff}km desde a última troca.',
            'reason': 'O óleo perde a viscosidade e capacidade de lubrificação com o tempo/uso, podendo fundir o motor.',
            'priority': 'URGENTE' if oil_diff >= 10000 else 'PRÓXIMOS 30 DIAS',
            'image_url': ''
        })
        item_id += 1
    
    if oil_diff >= 9000:
        checklist.append({
            'id': item_id,
            'name': 'Filtro de Ar do Motor',
            'description': 'Recomendado trocar junto com o óleo para manter desempenho ideal.',
            'reason': 'Filtro sujo aumenta o consumo de combustível e reduz a desempenho do motor.',
            'priority': 'PRÓXIMOS 30 DIAS',
            'image_url': ''
        })
        item_id += 1
    
    if current_km >= 15000:
        checklist.append({
            'id': item_id,
            'name': 'Filtro de Cabine (Ar-condicionado)',
            'description': 'Verificar e trocar se necessário para manter a qualidade do ar interno.',
            'reason': 'Filtro de cabine sujo pode causar alergias, mau cheiro e reduzir a eficiência do ar-condicionado.',
            'priority': 'PRÓXIMOS 60 DIAS',
            'image_url': ''
        })
        item_id += 1
    
    belt_diff = current_km - (vehicle.last_belt_change or 0)
    engine_type = vehicle.engine_type or ''
    uses_timing_chain = 'E.torQ' in engine_type or 'Firefly' in engine_type or '1.8' in engine_type
    
    if uses_timing_chain:
        checklist.append({
            'id': item_id,
            'name': 'Inspecção da Corrente de Distribuição',
            'description': f'Verificar tensão da corrente e condição dos componentes, já que o veículo tem {current_km}km.',
            'reason': 'Corrente desgastada pode causar ruído e desalinhamento no sincronismo do motor.',
            'priority': 'PRÓXIMOS 60 DIAS',
            'image_url': ''
        })
        item_id += 1
        checklist.append({
            'id': item_id,
            'name': 'Inspecção dos Guias da Corrente',
            'description': 'Verificar desgaste nos guias da corrente de distribuição.',
            'reason': 'Guias desgastadas podem causar ruído e diminuir a vida útil da corrente.',
            'priority': 'PRÓXIMOS 60 DIAS',
            'image_url': ''
        })
        item_id += 1
        checklist.append({
            'id': item_id,
            'name': 'Inspecção do Tensor da Corrente',
            'description': 'Verificar se o tensor está mantendo a tensão correta na corrente.',
            'reason': 'Tensor defeituoso pode causar ruído e desgaste excessivo na corrente.',
            'priority': 'PRÓXIMOS 60 DIAS',
            'image_url': ''
        })
        item_id += 1
    else:
        if belt_diff >= 45000:
            checklist.append({
                'id': item_id,
                'name': 'Correia Dentada e Tensor',
                'description': f'Seu carro rodou {belt_diff}km com a correia atual. Recomenda-se troca preventiva.',
                'reason': 'A quebra da correia causa o atropelamento de válvulas, um dano gravíssimo e caro no cabeçote.',
                'priority': 'URGENTE' if belt_diff >= 55000 else 'PRÓXIMOS 60 DIAS',
                'image_url': ''
            })
            item_id += 1
    
    if current_km >= 50000:
        checklist.append({
            'id': item_id,
            'name': 'Correia de Acessórios (Poly-V)',
            'description': 'Verificar estado da correia e trocar se houver rachaduras ou desgaste excessivo.',
            'reason': 'Se a correia quebrar, o alternador, bomba d\'água e compressor do ar-condicionado param de funcionar.',
            'priority': 'PRÓXIMOS 90 DIAS',
            'image_url': ''
        })
        item_id += 1
    
    brake_diff = current_km - (vehicle.last_brake_change or 0)
    if brake_diff >= 18000:
        checklist.append({
            'id': item_id,
            'name': 'Pastilhas de Freio Dianteiras e Traseiras',
            'description': f'Última revisão de freios foi há {brake_diff}km. Verificar desgaste das pastilhas.',
            'reason': 'Pastilhas gastas perdem eficiência de frenagem, aumentam a distância de parada e podem danificar os discos de freio.',
            'priority': 'URGENTE' if brake_diff >= 25000 else 'PRÓXIMOS 30 DIAS',
            'image_url': ''
        })
        item_id += 1
    
    if current_km >= 20000:
        checklist.append({
            'id': item_id,
            'name': 'Fluido de Freio',
            'description': 'Verificar nível e qualidade do fluido de freio. Recomenda-se troca a cada 2 anos.',
            'reason': 'Fluido de freio absorve umidade com o tempo, o que reduz a eficiência da frenagem e pode causar falha no sistema.',
            'priority': 'PRÓXIMOS 90 DIAS',
            'image_url': ''
        })
        item_id += 1
    
    if current_km >= 30000:
        checklist.append({
            'id': item_id,
            'name': 'Líquido de Arrefecimento',
            'description': 'Verificar nível, estado e concentração do líquido de arrefecimento.',
            'reason': 'Evita oxidação interna, superaquecimento do motor e danos ao radiador e bomba d\'água.',
            'priority': 'PRÓXIMOS 90 DIAS',
            'image_url': ''
        })
        item_id += 1
    
    if current_km >= 35000:
        checklist.append({
            'id': item_id,
            'name': 'Velas de Ignição',
            'description': 'Verificar estado das velas e trocar se necessário para manter eficiência do motor.',
            'reason': 'Velas gastas causam dificuldade de partida, aumento de consumo, perda de desempenho e vibrações.',
            'priority': 'PRÓXIMOS 60 DIAS',
            'image_url': ''
        })
        item_id += 1
    
    if current_km >= 40000:
        checklist.append({
            'id': item_id,
            'name': 'Amortecedores e Sistema de Suspensão',
            'description': 'Inspecção visual de amortecedores, coxins, buchas, pivôs e terminais de direção.',
            'reason': 'Componentes da suspensão desgastados comprometem a estabilidade, dirigibilidade e aumentam o desgaste dos pneus.',
            'priority': 'PRÓXIMOS 60 DIAS',
            'image_url': ''
        })
        item_id += 1
    
    if current_km >= 10000:
        checklist.append({
            'id': item_id,
            'name': 'Bateria e Sistema Elétrico',
            'description': 'Verificar estado da bateria, terminais, alternador e motor de partida.',
            'reason': 'Bateria fraca pode causar dificuldade de partida ou deixar o usuário na rua sem aviso prévio.',
            'priority': 'PRÓXIMOS 90 DIAS',
            'image_url': ''
        })
        item_id += 1
    
    checklist.append({
        'id': item_id,
        'name': 'Pneus: Rodízio, Balanceamento e Alinhamento',
        'description': 'Realizar rodízio dos pneus para uniformizar o desgaste, balanceamento e verificação do alinhamento.',
        'reason': 'Pneus com desgaste irregular reduzem a vida útil, comprometem a segurança e aumentam o consumo de combustível.',
        'priority': 'PRÓXIMOS 30 DIAS' if current_km % 10000 < 2000 else 'PRÓXIMOS 60 DIAS',
        'image_url': ''
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
        return jsonify({'error': 'Campos obrigatórios ausentes'}), 400
    
    try:
        vehicle_id = data['vehicle_id']
        vehicle = Vehicle.query.get(vehicle_id)
        if not vehicle:
            print(f"Erro: Veículo ID {vehicle_id} não encontrado no banco")
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
        return jsonify({'message': 'Histórico de manutenção salvo com sucesso'}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao salvar no banco: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/user/report/<int:user_id>', methods=['GET'])
def get_user_report(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    vehicles = Vehicle.query.filter_by(user_id=user_id).all()
    all_history = []
    for v in vehicles:
        for h in v.maintenance_history:
            history_dict = h.to_dict()
            history_dict['vehicle_model'] = v.model
            all_history.append(history_dict)
            
    all_history.sort(key=lambda x: x['last_date'] if x['last_date'] else '', reverse=True)
    
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
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    vehicle = Vehicle.query.filter_by(user_id=user_id).order_by(Vehicle.id.desc()).first()
    
    status = {
        'user': user.to_dict(),
        'vehicle': vehicle.to_dict() if vehicle else None,
        'recommendation': "Nenhuma recomendação no momento."
    }
    
    if vehicle:
        current_km = vehicle.mileage or 0
        
        oil_diff = current_km - (vehicle.last_oil_change or 0)
        if oil_diff >= 9000:
            status['recommendation'] = f"Seu carro está com {current_km} km. Troca de óleo necessária (última há {oil_diff} km)!"
        else:
            next_change = (vehicle.last_oil_change or 0) + 10000
            status['recommendation'] = f"Próxima troca de óleo estimada aos {next_change} km."
            
        belt_diff = current_km - (vehicle.last_belt_change or 0)
        if belt_diff >= 45000:
            status['recommendation'] = f"ALERTA CRÍTICO: Correia dentada rodou {belt_diff} km. Troque agora para evitar danos!"

    return jsonify(status), 200

@app.route('/user/vehicles/<int:user_id>', methods=['GET'])
def get_user_vehicles(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    vehicles = Vehicle.query.filter_by(user_id=user_id).all()
    return jsonify({'vehicles': [v.to_dict() for v in vehicles]}), 200

@app.route('/user/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    return jsonify(user.to_dict()), 200

@app.route('/user/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'Usuário excluído com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/users', methods=['GET'])
def get_all_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200

@app.route('/user/activate-premium/<int:user_id>', methods=['POST'])
def activate_premium(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    user.is_premium = True
    db.session.commit()
    
    return jsonify({
        'message': 'Premium ativado com sucesso',
        'user': user.to_dict()
    }), 200

@app.route('/user/change-password/<int:user_id>', methods=['PUT'])
def change_password(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    data = request.json
    
    if not data or not data.get('current_password') or not data.get('new_password'):
        return jsonify({'error': 'Campos obrigatórios ausentes'}), 400
    
    if user.password != data['current_password']:
        return jsonify({'error': 'Senha atual incorreta'}), 400
    
    if user.password == data['new_password']:
        return jsonify({'error': 'Nova senha deve ser diferente da senha atual'}), 400
    
    user.password = data['new_password']
    db.session.commit()
    
    return jsonify({'message': 'Senha alterada com sucesso'}), 200

@app.route('/user/recover-password', methods=['POST'])
def recover_password():
    data = request.json
    
    if not data or not data.get('email'):
        return jsonify({'error': 'Email é obrigatório'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user:
        return jsonify({'message': 'Se este email estiver cadastrado, você receberá um link de recuperação de senha'}), 200
    
    print(f"[SIMULAÇÃO] Enviando email de recuperação para {user.email}")
    
    return jsonify({'message': 'Se este email estiver cadastrado, você receberá um link de recuperação de senha'}), 200

@app.route('/user/<int:user_id>/reminder-frequency', methods=['GET'])
def get_reminder_frequency(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    return jsonify({'frequency': user.reminder_frequency}), 200

@app.route('/user/<int:user_id>/reminder-frequency', methods=['PUT'])
def update_reminder_frequency(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    data = request.json
    if 'frequency' not in data:
        return jsonify({'error': 'Campo frequency obrigatório'}), 400
    user.reminder_frequency = data['frequency']
    db.session.commit()
    return jsonify({'message': 'Frequência atualizada com sucesso', 'frequency': user.reminder_frequency}), 200

@app.route('/user/notifications/<int:user_id>', methods=['GET'])
def get_user_notifications(user_id):
    notifications = [
        {
            'id': 1,
            'title': 'Bem-vindo!',
            'message': 'Obrigado por usar o nosso app!',
            'read': False,
            'created_at': '2026-07-09'
        }
    ]
    return jsonify({'notifications': notifications}), 200

@app.route('/user/notifications/mark-read/<int:user_id>', methods=['POST'])
def mark_notifications_read(user_id):
    return jsonify({'message': 'Notificações marcadas como lidas'}), 200

def validate_and_fix_images(data, key):
    if key in data:
        for item in data[key]:
            item['image_url'] = ''
    return data

@app.route('/vehicle/parts/ai/<int:vehicle_id>', methods=['GET'])
def get_vehicle_parts_ai(vehicle_id):
    vehicle = Vehicle.query.get(vehicle_id)
    if not vehicle:
        return jsonify({'error': 'Veículo não encontrado'}), 404

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here" or not client:
        print("OpenAI API Key missing. Falling back to static parts catalog.")
        return get_vehicle_parts(vehicle_id)

    try:
        prompt = f"""
        Como um engenheiro mecânico automotivo sênior especialista em manutenção preventiva, gere um catálogo focado EXCLUSIVAMENTE em PEÇAS DE MANUTENÇÃO para o veículo abaixo.
        Dados específicos do veículo:
        - Marca: {vehicle.brand}
        - Modelo: {vehicle.model}
        - Ano: {vehicle.year}
        - Motorização: {vehicle.engine_type}
        - Transmissão: {vehicle.transmission}
        - Combustível: {vehicle.fuel_type}
        - Perfil de Uso: {vehicle.usage_type}
        Retorne apenas um JSON no formato com pelo menos 15 peças essenciais:
        {{"parts": [{{"id": 1, "name": "Nome da Peça", "category": "Categoria", "subcategory": "Tipo", "description": "Descrição", "image_url": "", "details": {{"purpose": "", "location": "", "common_problems": "", "maintenance_interval": ""}}}}]}}
        """
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "Você é um engenheiro mecânico sênior especialista em catálogo de peças automotivas."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )
        ai_data = json.loads(response.choices[0].message.content)
        ai_data = validate_and_fix_images(ai_data, 'parts')
        return jsonify({
            'vehicle': f"{vehicle.brand} {vehicle.model} ({vehicle.year}) - {vehicle.transmission} - {vehicle.engine_type}",
            'parts': ai_data['parts']
        }), 200
    except Exception as e:
        print(f"AI Parts Error: {str(e)}. Falling back to static data.")
        return get_vehicle_parts(vehicle_id)

@app.route('/vehicle/checklist/ai/<int:vehicle_id>', methods=['GET'])
def get_vehicle_checklist_ai(vehicle_id):
    vehicle = Vehicle.query.get(vehicle_id)
    if not vehicle:
        return jsonify({'error': 'Veículo não encontrado'}), 404
        
    current_km = vehicle.mileage or 0
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here" or not client:
        print("OpenAI API Key missing. Falling back to static checklist.")
        return get_vehicle_checklist(vehicle_id)

    try:
        prompt = f"""
        Como um mecânico especialista em manutenção preventiva, gere um checklist para um {vehicle.brand} {vehicle.model} ano {vehicle.year} com {current_km}km.
        Retorne apenas um JSON com pelo menos 10 itens:
        {{"checklist": [{{"id": 1, "name": "Item", "description": "Descrição", "reason": "Motivo", "priority": "PRÓXIMOS 30 DIAS", "image_url": ""}}]}}
        """
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "Você é um mecânico master de concessionária especialista em manutenção preventiva."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )
        ai_data = json.loads(response.choices[0].message.content)
        ai_data = validate_and_fix_images(ai_data, 'checklist')
        return jsonify({
            'vehicle': f"{vehicle.brand} {vehicle.model}",
            'mileage': current_km,
            'checklist': ai_data['checklist']
        }), 200
    except Exception as e:
        print(f"AI Checklist Error: {str(e)}. Falling back to static data.")
        return get_vehicle_checklist(vehicle_id)

@app.route('/vehicle/maintenance-tips/<int:vehicle_id>', methods=['GET'])
def get_maintenance_tips(vehicle_id):
    vehicle = Vehicle.query.get(vehicle_id)
    if not vehicle:
        return jsonify({'error': 'Veículo não encontrado'}), 404

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here" or not client:
        print("OpenAI API Key missing. Falling back to static maintenance tips.")
        return get_static_maintenance_tips(vehicle)

    try:
        prompt = f"""
        Como um engenheiro mecânico automotivo sênior, gere 5 dicas de manutenção para um {vehicle.brand} {vehicle.model} ano {vehicle.year}.
        Retorne apenas um JSON: {{"tips": [{{"id": 1, "title": "Título", "content": "Conteúdo"}}]}}
        """
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "Você é um mecânico sênior especialista em manutenção preventiva."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )
        ai_data = json.loads(response.choices[0].message.content)
        return jsonify({
            'vehicle': f"{vehicle.brand} {vehicle.model} ({vehicle.year})",
            'tips': ai_data['tips']
        }), 200
    except Exception as e:
        print(f"AI Tips Error: {str(e)}. Falling back to static data.")
        return get_static_maintenance_tips(vehicle)

def get_static_maintenance_tips(vehicle):
    tips = [
        {
            'id': 1,
            'title': 'Óleo do motor',
            'content': 'Verifique o nível do óleo a cada 15 dias ou antes de viagens longas. Observe nível, viscosidade e cor. Troque entre 5.000 e 10.000 km, conforme o tipo do óleo e o manual do carro.'
        },
        {
            'id': 2,
            'title': 'Fluidos essenciais',
            'content': 'Cheque fluido de freio, direção hidráulica, embreagem (se houver), arrefecimento e limpador de para-brisa. Todos devem estar no nível correto.'
        },
        {
            'id': 3,
            'title': 'Calibragem dos pneus',
            'content': 'Faça semanalmente com pneus frios. Pressões ideais estão no manual ou na porta do motorista.'
        },
        {
            'id': 4,
            'title': 'Pastilhas e discos de freio',
            'content': 'Ruídos ao frear, vibração no pedal ou aumento da distância de frenagem indicam desgaste.'
        },
        {
            'id': 5,
            'title': f'Câmbio {vehicle.transmission or ""}',
            'content': 'Verifique vazamentos e dificuldade de engatar — pode indicar desgaste no kit embreagem (para câmbio manual).'
        }
    ]
    return jsonify({
        'vehicle': f"{vehicle.brand} {vehicle.model} ({vehicle.year})",
        'tips': tips
    }), 200

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
        return jsonify({'message': 'Usuário registrado com sucesso', 'user': new_user.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Erro de banco de dados: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Credenciais ausentes'}), 400
    
    user = User.query.filter_by(email=data['email'], password=data['password']).first()
    
    if user:
        return jsonify({'message': 'Login realizado com sucesso', 'user': user.to_dict()}), 200
    else:
        return jsonify({'error': 'Email ou senha inválidos'}), 401

@app.route('/logout', methods=['POST'])
def logout():
    return jsonify({'message': 'Logout realizado com sucesso'}), 200

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
    
@app.route('/vehicle/maintenance/<int:maintenance_id>', methods=['PUT', 'PATCH'])
def update_maintenance(maintenance_id):
    print(f"\n=== ATUALIZANDO MANUTENÇÃO ID: {maintenance_id} ===")
    data = request.json
    entry = MaintenanceHistory.query.get(maintenance_id)
    if not entry:
        return jsonify({'error': 'Registro não encontrado'}), 404

    try:
        if 'last_date' in data:
            entry.last_date = data['last_date']
        if 'cost' in data:
            entry.cost = float(data['cost'])
        if 'liters' in data:
            entry.liters = float(data['liters'])
        if 'item' in data:
            entry.item = data['item']

        db.session.commit()
        print("Registro atualizado com sucesso!")
        return jsonify({'message': 'Registro atualizado com sucesso', 'entry': entry.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao atualizar: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/vehicle/parts/<int:vehicle_id>', methods=['GET'])
def get_vehicle_parts(vehicle_id):
    vehicle = Vehicle.query.get(vehicle_id)
    if not vehicle:
        return jsonify({'error': 'Veículo não encontrado'}), 404
        
    transmission_type = vehicle.transmission.lower() if vehicle.transmission else 'manual'
    is_automatic = 'autom' in transmission_type
    
    parts_catalog = [
        {
            'id': 1,
            'name': 'Filtro de Óleo',
            'category': 'Filtros',
            'subcategory': 'Manutenção Preventiva',
            'description': f'Filtra as impurezas do óleo. Se não trocado, o óleo sujo causa atrito excessivo.',
            'details': {
                'purpose': 'Manter a pureza do lubrificante para proteger bronzinas e pistões.',
                'location': 'Parte inferior do motor, próximo ao cárter.',
                'common_problems': 'Luz de óleo piscando ou ruídos metálicos no motor.',
                'maintenance_interval': '10.000km ou 1 ano'
            },
            'image_url': ''
        },
        {
            'id': 2,
            'name': 'Filtro de Ar do Motor',
            'category': 'Filtros',
            'subcategory': 'Manutenção Preventiva',
            'description': 'Impede que poeira entre no motor. O acúmulo de sujeira aumenta o consumo.',
            'details': {
                'purpose': 'Garantir que apenas ar limpo entre na câmara de combustão.',
                'location': 'Caixa plástica conectada à admissão do motor.',
                'common_problems': 'Perda de potência e aumento do consumo de combustível.',
                'maintenance_interval': '20.000km'
            },
            'image_url': ''
        },
        {
            'id': 3,
            'name': 'Pastilhas de Freio Dianteiras',
            'category': 'Sistema de Freios',
            'subcategory': 'Manutenção Preventiva',
            'description': 'Componente de atrito que para o carro.',
            'details': {
                'purpose': 'Transformar energia cinética em calor para frear o veículo.',
                'location': 'Dentro das pinças de freio nas rodas dianteiras.',
                'common_problems': 'Assobio agudo ao frear.',
                'maintenance_interval': 'Verificar a cada 10.000km'
            },
            'image_url': ''
        }
    ]
    
    if is_automatic:
        parts_catalog.extend([
            {
                'id': 100,
                'name': 'Fluido de Transmissão ATF',
                'category': 'Transmissão Específica',
                'subcategory': f'Automático ({vehicle.transmission})',
                'description': 'Óleo específico para transmissões automáticas.',
                'details': {
                    'purpose': 'Lubrificação, arrefecimento e transferência de força hidráulica.',
                    'location': 'Sistema de transmissão.',
                    'common_problems': 'Degradação por calor, causando patinação.',
                    'maintenance_interval': 'Trocar a cada 60.000km'
                },
                'image_url': ''
            }
        ])
    else:
        parts_catalog.extend([
            {
                'id': 110,
                'name': 'Kit de Embreagem',
                'category': 'Transmissão Específica',
                'subcategory': 'Manual',
                'description': 'Kit completo para câmbio manual.',
                'details': {
                    'purpose': 'Acoplamento e desacoplamento do motor com o câmbio.',
                    'location': 'Entre o motor e a caixa de câmbio.',
                    'common_problems': 'Embreagem "patinando" ou pedal pesado.',
                    'maintenance_interval': '80.000km a 100.000km'
                },
                'image_url': ''
            }
        ])

    return jsonify({
        'vehicle': f"{vehicle.brand} {vehicle.model} ({vehicle.year}) - {vehicle.transmission} - {vehicle.engine_type}",
        'parts': parts_catalog
    }), 200

def create_tables_safe():
    """Cria tabelas com tratamento de erros"""
    try:
        with app.app_context():
            db.create_all()
        print("[AMP] Tabelas do banco de dados criadas com sucesso!")
    except Exception as e:
        print(f"[AMP] Erro ao criar tabelas: {e}")

def start_server():
    """Inicia o servidor Flask com tratamento de erros"""
    try:
        create_tables_safe()
        print("[AMP] Iniciando servidor Flask em http://127.0.0.1:5000...")
        app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False, threaded=True)
    except Exception as e:
        print(f"[AMP] Erro fatal no servidor: {e}")
