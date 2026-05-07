from app import app, db, User

with app.app_context():
    users = User.query.all()
    print(f"Total users: {len(users)}")
    for user in users:
        print(f"ID: {user.id}, Name: {user.full_name}, Email: {user.email}")
