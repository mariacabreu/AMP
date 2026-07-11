from flask import Blueprint, request, jsonify
from app.models.models import User, Vehicle, MaintenanceHistory
from app import db
import os

user_bp = Blueprint('user', __name__)

PLAN_VEHICLE_LIMITS = {
    'free': 1,
    'mensal': 1,
    'trimestral': 3,
    'anual': 5
}


def get_vehicle_limit(plan_type):
    return PLAN_VEHICLE_LIMITS.get(plan_type, 1)


@user_bp.route('/user/report/<int:user_id>', methods=['GET'])
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


@user_bp.route('/user/status/<int:user_id>', methods=['GET'])
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
        current_km = vehicle.mileage
        oil_diff = current_km - vehicle.last_oil_change
        if oil_diff >= 9000:
            status['recommendation'] = f"Seu carro está com {current_km} km. Troca de óleo necessária (última há {oil_diff} km)!"
        else:
            next_change = vehicle.last_oil_change + 10000
            status['recommendation'] = f"Próxima troca de óleo estimada aos {next_change} km."

    return jsonify(status), 200


@user_bp.route('/user/vehicles/<int:user_id>', methods=['GET'])
def get_user_vehicles(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404

    vehicles = Vehicle.query.filter_by(user_id=user_id).all()
    return jsonify({'vehicles': [v.to_dict() for v in vehicles]}), 200


@user_bp.route('/user/<int:user_id>', methods=['GET', 'PUT', 'PATCH'])
def get_or_update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404

    if request.method in ['PUT', 'PATCH']:
        data = request.json
        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'email' in data:
            user.email = data['email']
        if 'phone' in data:
            user.phone = data['phone']
        if 'reminder_frequency' in data:
            user.reminder_frequency = data['reminder_frequency']

        db.session.commit()
        return jsonify({'message': 'Usuário atualizado com sucesso', 'user': user.to_dict()}), 200

    return jsonify(user.to_dict()), 200


@user_bp.route('/users', methods=['GET'])
def get_all_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200


@user_bp.route('/user/set-plan/<int:user_id>', methods=['POST'])
def set_user_plan(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404

    data = request.json
    plan_type = data.get('plan_type')
    if plan_type not in PLAN_VEHICLE_LIMITS:
        return jsonify({'error': f'Plano inválido. Opções: {list(PLAN_VEHICLE_LIMITS.keys())}'}), 400

    user.plan_type = plan_type
    user.is_premium = plan_type != 'free'
    db.session.commit()

    return jsonify({
        'message': 'Plano atualizado com sucesso',
        'user': user.to_dict()
    }), 200

