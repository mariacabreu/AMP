import mysql.connector
from mysql.connector import errorcode

# Database configuration - Update these if needed
config = {
    'user': 'root',
    'password': '',
    'host': '127.0.0.1',
}

DB_NAME = 'amp_db'

def create_database(cursor):
    try:
        cursor.execute(
            f"CREATE DATABASE {DB_NAME} DEFAULT CHARACTER SET 'utf8'")
    except mysql.connector.Error as err:
        print(f"Failed creating database: {err}")
        exit(1)

def setup():
    try:
        cnx = mysql.connector.connect(**config)
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            print("Something is wrong with your user name or password")
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
            print("Database does not exist")
        else:
            print(err)
        return

    cursor = cnx.cursor()

    try:
        cursor.execute(f"USE {DB_NAME}")
    except mysql.connector.Error as err:
        print(f"Database {DB_NAME} does not exists.")
        if err.errno == errorcode.ER_BAD_DB_ERROR:
            create_database(cursor)
            print(f"Database {DB_NAME} created successfully.")
            cnx.database = DB_NAME
        else:
            print(err)
            exit(1)

    # Tables are created automatically by Flask-SQLAlchemy in app.py
    # but we can verify the connection here.
    print("Database connection verified successfully.")

    cursor.close()
    cnx.close()

if __name__ == '__main__':
    setup()
