import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'amp_db.db')
print(f"Checking database at: {db_path}")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(user)")
columns = cursor.fetchall()
print("Columns in user table:")
for col in columns:
    print(f"  {col}")
conn.close()
