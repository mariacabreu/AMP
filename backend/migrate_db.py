import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'amp_db.db')

def migrate():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check user table columns
    cursor.execute("PRAGMA table_info(user)")
    user_columns = [column[1] for column in cursor.fetchall()]
    
    if 'plan_type' not in user_columns:
        print("Adding plan_type column to user table...")
        cursor.execute("ALTER TABLE user ADD COLUMN plan_type VARCHAR(20) DEFAULT 'free'")
        conn.commit()
        print("plan_type column added successfully!")
    else:
        print("plan_type column already exists.")
    
    if 'reminder_frequency' not in user_columns:
        print("Adding reminder_frequency column to user table...")
        cursor.execute("ALTER TABLE user ADD COLUMN reminder_frequency VARCHAR(50) DEFAULT 'biweekly'")
        conn.commit()
        print("reminder_frequency column added successfully!")
    else:
        print("reminder_frequency column already exists.")
    
    if 'phone' not in user_columns:
        print("Adding phone column to user table...")
        cursor.execute("ALTER TABLE user ADD COLUMN phone VARCHAR(20)")
        conn.commit()
        print("phone column added successfully!")
    else:
        print("phone column already exists.")

    if 'avatar' not in user_columns:
        print("Adding avatar column to user table...")
        cursor.execute("ALTER TABLE user ADD COLUMN avatar TEXT")
        conn.commit()
        print("avatar column added successfully!")
    else:
        print("avatar column already exists.")
    
    # Check if obd_scan table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='obd_scan'")
    obd_scan_exists = cursor.fetchone()
    
    if not obd_scan_exists:
        print("Creating obd_scan table...")
        cursor.execute("""
            CREATE TABLE obd_scan (
                id INTEGER PRIMARY KEY,
                vehicle_id INTEGER NOT NULL,
                scan_date VARCHAR(50) NOT NULL,
                dtc_codes JSON DEFAULT '[]',
                live_data JSON DEFAULT '{}',
                connected_device VARCHAR(100),
                FOREIGN KEY (vehicle_id) REFERENCES vehicle (id)
            )
        """)
        conn.commit()
        print("obd_scan table created successfully!")
    else:
        print("obd_scan table already exists.")
    
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
