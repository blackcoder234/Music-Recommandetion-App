import os
from dotenv import load_dotenv
from pymongo import MongoClient
import sys

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI")
if not MONGO_URI:
    print("Error: MONGODB_URI not found in environment variables")
    sys.exit(1)

def get_database():
    try:
        client = MongoClient(MONGO_URI)
        # Verify connection
        client.admin.command('ping')
        print("Successfully connected to MongoDB Atlas!")
        
        # Access the database (assuming the default db name from URI or 'test' or specific name)
        # Based on URI: mongodb+srv://.../cluster0... usually default is 'test' unless specified.
        # But let's check what databases are available or use the one from connection string.
        # If no DB specified in URI, we might need to know the DB name. 
        # Usually for this project it seems like it might be 'music_system' or similar. 
        # For now, let's list database names to confirm.
        return client
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return None

if __name__ == "__main__":
    client = get_database()
    if client:
        print("Databases:", client.list_database_names())
