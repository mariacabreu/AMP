from app import app, db, User, Vehicle

def seed_database():
    with app.app_context():
        # Clear existing data
        db.drop_all()
        db.create_all()

        # Create a default user
        user = User(
            full_name="Usuário Demo",
            email="demo@amp.com",
            password="123"
        )
        db.session.add(user)
        db.session.commit()

        # Create a default vehicle for this user
        vehicle = Vehicle(
            brand="Volkswagen",
            model="Golf",
            year=2022,
            transmission="Automático",
            mileage=45000,
            fuel_type="Flex",
            user_id=user.id,
            last_oil_change=35000,
            last_belt_change=0,
            last_brake_change=25000
        )
        db.session.add(vehicle)
        db.session.commit()
        
        print("Database seeded successfully with user 'demo@amp.com' and a Volkswagen Golf!")

if __name__ == "__main__":
    seed_database()
