import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'amp_db.db')
print(f"Checking database at: {db_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check user table schema
cursor.execute("PRAGMA table_info(user)")
columns = cursor.fetchall()
print("\nColumns in 'user' table:")
for col in columns:
    print(col)

# Check if there are any existing users
cursor.execute("SELECT * FROM user")
users = cursor.fetchall()
print("\nExisting users:")
for user in users:
    print(user)

conn.close()
