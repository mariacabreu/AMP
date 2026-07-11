from flask import Blueprint, request, jsonify
from app.models.models import Vehicle, MaintenanceHistory, OBDScan
from app import db
import json
import os

vehicle_bp = Blueprint('vehicle', __name__)

# --- Dados de veículos compatíveis ---
SUPPORTED_BRANDS = {
    'Ford': {
        'models': ['Fiesta', 'Focus', 'Ranger', 'Ka', 'EcoSport', 'Fusion', 'Edge', 'Mustang', 'Territory', 'Bronco'],
        'engines': {
            'Fiesta': ['1.0 Rocam', '1.6 Rocam', '1.0 EcoBoost', '1.5 Sigma'],
            'Focus': ['1.6 Sigma', '2.0 Duratec', '2.0 GDI'],
            'Ranger': ['2.2 Diesel', '3.2 Diesel', '2.5 Flex'],
        },
        'start_year': 2010,
    },
    'Chevrolet': {
        'models': ['Onix', 'Prisma', 'Cruze', 'S10', 'Tracker', 'Spin', 'Montana', 'Equinox', 'Trailblazer', 'Camaro'],
        'engines': {
            'Onix': ['1.0 Aspirado', '1.0 Turbo', '1.4 Aspirado'],
        },
        'start_year': 2011,
    },
    'Volkswagen': {
        'models': ['Gol', 'Polo', 'Golf', 'T-Cross', 'Amarok', 'Virtus', 'Nivus', 'Taos', 'Jetta', 'Tiguan', 'Voyage', 'Saveiro'],
        'start_year': 2010,
    },
    'Toyota': {
        'models': ['Corolla', 'Hilux', 'Yaris', 'Etios', 'SW4', 'Rav4', 'Camry', 'Prius', 'Corolla Cross'],
        'start_year': 2012,
    },
}


@vehicle_bp.route('/vehicle/brands', methods=['GET'])
def get_brands():
    return jsonify(list(SUPPORTED_BRANDS.keys())), 200


@vehicle_bp.route('/vehicle/models/<brand>', methods=['GET'])
def get_models(brand):
    if brand in SUPPORTED_BRANDS:
        return jsonify(SUPPORTED_BRANDS[brand]['models']), 200
    return jsonify({'error': 'Marca não suportada'}), 404


@vehicle_bp.route('/vehicle/engines/<brand>/<model>', methods=['GET'])
def get_engines(brand, model):
    if brand in SUPPORTED_BRANDS:
        brand_data = SUPPORTED_BRANDS[brand]
        if 'engines' in brand_data and model in brand_data['engines']:
            return jsonify(brand_data['engines'][model]), 200
        return jsonify(['1.0', '1.4', '1.6', '1.8', '2.0', '2.0 Turbo']), 200
    return jsonify({'error': 'Marca não suportada'}), 404


@vehicle_bp.route('/vehicle/years/<brand>/<model>', methods=['GET'])
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


@vehicle_bp.route('/vehicle/<int:vehicle_id>', methods=['GET', 'PUT', 'PATCH'])
def get_or_update_vehicle(vehicle_id):
    if request.method == 'GET':
        vehicle = Vehicle.query.get(vehicle_id)
        if not vehicle:
            return jsonify({'error': 'Veículo não encontrado'}), 404
        return jsonify(vehicle.to_dict()), 200

    data = request.json
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
        return jsonify({
            'message': 'Veículo atualizado com sucesso',
            'vehicle': vehicle.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@vehicle_bp.route('/vehicle/register', methods=['POST'])
def register_vehicle():
    data = request.json
    if not data or not all(k in data for k in ('brand', 'model', 'year', 'user_id')):
        return jsonify({'error': 'Campos obrigatórios ausentes'}), 400

    from app.models.models import User
    user = User.query.get(data['user_id'])
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404

    PLAN_VEHICLE_LIMITS = {'free': 1, 'mensal': 1, 'trimestral': 3, 'anual': 5}
    current_vehicle_count = Vehicle.query.filter_by(user_id=user.id).count()
    vehicle_limit = PLAN_VEHICLE_LIMITS.get(user.plan_type, 1)

    if current_vehicle_count >= vehicle_limit:
        return jsonify({
            'error': f'Limite de veículos atingido para o plano "{user.plan_type or "free"}". Máximo permitido: {vehicle_limit}.',
            'limit_reached': True,
            'current_count': current_vehicle_count,
            'limit': vehicle_limit
        }), 403

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


@vehicle_bp.route('/vehicle/checklist/<int:vehicle_id>', methods=['GET'])
def get_vehicle_checklist(vehicle_id):
    vehicle = Vehicle.query.get(vehicle_id)
    if not vehicle:
        return jsonify({'error': 'Veículo não encontrado'}), 404

    current_km = vehicle.mileage
    checklist = []
    item_id = 1

    oil_diff = current_km - vehicle.last_oil_change
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

    return jsonify({
        'vehicle': f"{vehicle.brand} {vehicle.model}",
        'mileage': current_km,
        'checklist': checklist
    }), 200

