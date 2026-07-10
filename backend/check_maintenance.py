
from app import app, db, User, Vehicle, MaintenanceHistory

with app.app_context():
    user = User.query.get(1)
    if user:
        print(f"Usuário: {user.full_name} ({user.email})")
        vehicles = Vehicle.query.filter_by(user_id=user.id).all()
        for v in vehicles:
            print(f"Veículo: {v.brand} {v.model} ({v.year})")
            history = MaintenanceHistory.query.filter_by(vehicle_id=v.id).all()
            if history:
                print("Histórico de manutenção:")
                for h in history:
                    print(f"  - {h.item}: {h.last_km} km em {h.last_date} (Custo: R${h.cost:.2f})")
            else:
                print("  Nenhum histórico de manutenção")
