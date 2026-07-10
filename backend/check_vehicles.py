
from app import app, db, User, Vehicle

with app.app_context():
    users = User.query.all()
    for user in users:
        print(f"Usuário: {user.full_name} ({user.email}) - ID {user.id}")
        vehicles = Vehicle.query.filter_by(user_id=user.id).all()
        if vehicles:
            for v in vehicles:
                print(f"  Veículo: {v.brand} {v.model} ({v.year}) - {v.mileage} km")
        else:
            print("  Nenhum veículo cadastrado")
        print()
