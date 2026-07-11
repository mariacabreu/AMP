from flask import Blueprint, request, jsonify
from app.models.models import Vehicle, MaintenanceHistory, OBDScan
from app import db
import json
import os

try:
    from openai import OpenAI
    from dotenv import load_dotenv
    load_dotenv()
    openai_api_key = os.getenv("OPENAI_API_KEY")
    client = OpenAI(api_key=openai_api_key) if openai_api_key and openai_api_key != "your_openai_api_key_here" else None
except ImportError:
    client = None
    print("OpenAI module not available - AI features will use static fallback")

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


def validate_and_fix_images(data, key):
    """Garante que não há erros de bloqueio removendo imagens externas."""
    if key in data:
        for item in data[key]:
            item['image_url'] = ''
    return data


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


@vehicle_bp.route('/vehicle/maintenance', methods=['POST'])
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


@vehicle_bp.route('/vehicle/maintenance/<int:maintenance_id>', methods=['DELETE'])
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


@vehicle_bp.route('/vehicle/maintenance/<int:maintenance_id>', methods=['PUT', 'PATCH'])
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


def get_static_maintenance_tips(vehicle):
    """Static fallback maintenance tips."""
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
            'content': 'Verifique vazamentos e dificuldade de engate — pode indicar desgaste no kit embreagem (para câmbio manual).'
        },
        {
            'id': 6,
            'title': 'Lavagem e enceramento',
            'content': 'Reduzem corrosão e protegem a pintura.'
        }
    ]

    return jsonify({
        'vehicle': f"{vehicle.brand} {vehicle.model} ({vehicle.year})",
        'tips': tips
    }), 200


@vehicle_bp.route('/vehicle/maintenance-tips/<int:vehicle_id>', methods=['GET'])
def get_maintenance_tips(vehicle_id):
    vehicle = Vehicle.query.get(vehicle_id)
    if not vehicle:
        return jsonify({'error': 'Veículo não encontrado'}), 404

    if not client:
        print("OpenAI API Key missing. Falling back to static maintenance tips.")
        return get_static_maintenance_tips(vehicle)

    prompt = f"""
    Como um engenheiro mecânico automotivo sênior, gere uma lista de DICAS DE MANUTENÇÃO PREVENTIVA ESPECÍFICAS para o veículo abaixo.

    Dados do veículo:
    - Marca: {vehicle.brand}
    - Modelo: {vehicle.model}
    - Ano: {vehicle.year}
    - Transmissão: {vehicle.transmission}
    - Motorização: {vehicle.engine_type}
    - Combustível: {vehicle.fuel_type}

    Instruções:
    1. Gere de 8 a 12 dicas práticas e úteis para o dia a dia do usuário
    2. Cada dica deve ser específica para este veículo, não genérica
    3. As dicas devem cobrir diferentes aspectos: inspeções simples, cuidados diários, economias de combustível, etc.
    4. Use linguagem clara e acessível

    Retorne APENAS um JSON no seguinte formato:
    {{
        "tips": [
            {{
                "id": 1,
                "title": "Título curto da dica",
                "content": "Conteúdo detalhado da dica, com explicações claras"
            }}
        ]
    }}
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": "Você é um mecânico sênior especialista em manutenção preventiva."},
                      {"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        ai_data = json.loads(response.choices[0].message.content)

        return jsonify({
            'vehicle': f"{vehicle.brand} {vehicle.model} ({vehicle.year})",
            'tips': ai_data['tips']
        }), 200
    except Exception as e:
        print(f"AI Maintenance Tips Error: {str(e)}. Falling back to static data.")
        return get_static_maintenance_tips(vehicle)


@vehicle_bp.route('/vehicle/parts/<int:vehicle_id>', methods=['GET'])
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
            'description': f'Filtra as impurezas do óleo. Se não trocado, o óleo sujo causa atrito excessivo e pode fundir o motor {vehicle.engine_type}.',
            'details': {
                'purpose': 'Manter a pureza do lubrificante para proteger bronzinas e pistões.',
                'location': 'Parte inferior do motor, próximo ao cárter.',
                'common_problems': 'Luz de óleo piscando ou ruídos metálicos no motor.',
                'maintenance_interval': '10.000km ou 1 ano'
            },
            'image_url': ''
        }
    ]
    
    return jsonify({
        'vehicle': f"{vehicle.brand} {vehicle.model} ({vehicle.year}) - {vehicle.transmission} - {vehicle.engine_type}",
        'parts': parts_catalog
    }), 200


@vehicle_bp.route('/vehicle/parts/ai/<int:vehicle_id>', methods=['GET'])
def get_vehicle_parts_ai(vehicle_id):
    vehicle = Vehicle.query.get(vehicle_id)
    if not vehicle:
        return jsonify({'error': 'Veículo não encontrado'}), 404

    if not client:
        print("OpenAI API Key missing. Falling back to static parts catalog.")
        return get_vehicle_parts(vehicle_id)

    prompt = f"""
    Como um engenheiro mecânico automotivo sênior especialista em manutenção preventiva, gere um catálogo focado EXCLUSIVAMENTE em PEÇAS DE MANUTENÇÃO para o veículo abaixo. O objetivo é ajudar o usuário a entender a função de cada peça e a importância de trocá-la preventivamente para evitar danos maiores.

    Dados específicos do veículo:
    - Marca: {vehicle.brand}
    - Modelo: {vehicle.model}
    - Ano: {vehicle.year}
    - Motorização: {vehicle.engine_type}
    - Transmissão: {vehicle.transmission}
    - Combustível: {vehicle.fuel_type}
    - Perfil de Uso: {vehicle.usage_type}

    Instruções críticas:
    1. Seja específico para este veículo exato:
       - Verifique se o motor usa CORRENTE DE DISTRIBUIÇÃO ou CORREIA DENTADA
       - Ajuste todos os itens para o motor, ano e modelo exatos
       - Não inclua peças que não existem ou não são necessárias para este veículo
    2. Se o motor usa corrente de distribuição:
       - Substitua "Correia Dentada" por "Corrente de Distribuição"
       - Inclua "Guias da Corrente de Distribuição"
       - Inclua "Tensor da Corrente de Distribuição"
       - Marque esses itens como "Inspecção" em vez de troca periódica obrigatória

    Retorne APENAS um JSON no formato:
    {{
        "parts": [
            {{
                "id": increment_id,
                "name": "Nome da Peça de Manutenção",
                "category": "Uma das categorias acima",
                "subcategory": "Tipo de manutenção (Preventiva/Inspecção)",
                "description": "Explicação clara da função e o risco de não realizar a manutenção para este veículo",
                "image_url": "",
                "details": {{
                    "purpose": "Finalidade técnica no contexto deste veículo",
                    "location": "Onde se encontra no carro",
                    "common_problems": "Sinais de que a peça está falhando",
                    "maintenance_interval": "Intervalo recomendado"
                }}
            }}
        ]
    }}
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": "Você é um engenheiro mecânico sênior especialista em catálogo de peças automotivas."},
                      {"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
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
