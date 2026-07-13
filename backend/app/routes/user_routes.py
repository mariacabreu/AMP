from flask import Blueprint, request, jsonify
from app.models.models import User, Vehicle, MaintenanceHistory
from app import db
import os

user_bp = Blueprint('user', __name__)

PLAN_VEHICLE_LIMITS = {
    'free': 1,
    'mensal': 1,
    'trimestral': 1,
    'anual': 1
}


def get_vehicle_limit(plan_type):
    return PLAN_VEHICLE_LIMITS.get(plan_type, 1)


@user_bp.route('/register', methods=['POST'])
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


@user_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Credenciais ausentes'}), 400
    
    user = User.query.filter_by(email=data['email'], password=data['password']).first()
    
    if user:
        return jsonify({'message': 'Login realizado com sucesso', 'user': user.to_dict()}), 200
    else:
        return jsonify({'error': 'Email ou senha inválidos'}), 401


@user_bp.route('/logout', methods=['POST'])
def logout():
    return jsonify({'message': 'Logout realizado com sucesso'}), 200


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

    vehicles = Vehicle.query.filter_by(user_id=user_id).all()
    vehicle = vehicles[0] if vehicles else None
    status = {
        'user': user.to_dict(),
        'vehicle': vehicle.to_dict() if vehicle else None,
        'vehicles': [v.to_dict() for v in vehicles],  # Always an array
        'recommendation': 'Nenhuma recomendação no momento.'
    }

    if vehicle:
        current_km = vehicle.mileage
        oil_diff = current_km - vehicle.last_oil_change
        if oil_diff >= 9000:
            status['recommendation'] = f'Seu carro está com {current_km} km. Troca de óleo necessária (última há {oil_diff} km)!'
        else:
            next_change = vehicle.last_oil_change + 10000
            status['recommendation'] = f'Próxima troca de óleo estimada aos {next_change} km.'

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
        if 'avatar' in data:
            user.avatar = data['avatar']

        db.session.commit()
        return jsonify({'message': 'Usuário atualizado com sucesso', 'user': user.to_dict()}), 200

    return jsonify(user.to_dict()), 200


@user_bp.route('/users', methods=['GET'])
def get_all_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200


@user_bp.route('/user/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    print(f"=== Tentando excluir usuário com ID: {user_id} ===")
    user = User.query.get(user_id)
    if not user:
        print(f"Erro: Usuário com ID {user_id} não encontrado")
        return jsonify({'error': 'Usuário não encontrado'}), 404

    try:
        print(f"Usuário encontrado: {user.email}")
        print(f"Veículos associados: {len(user.vehicles)}")
        db.session.delete(user)
        db.session.commit()
        print(f"Usuário {user.email} excluído com sucesso")
        return jsonify({'message': 'Usuário e todos os dados associados excluídos com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao excluir usuário: {str(e)}")
        return jsonify({'error': str(e)}), 500


@user_bp.route('/user/notifications/<int:user_id>', methods=['GET'])
def get_user_notifications(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404

    notifications = []  # Placeholder for notifications
    return jsonify({'notifications': notifications}), 200


@user_bp.route('/user/notifications/<int:user_id>/read-all', methods=['PATCH'])
def mark_all_notifications_read(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404

    return jsonify({'message': 'Notificações marcadas como lidas'}), 200


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
