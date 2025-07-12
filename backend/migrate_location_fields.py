#!/usr/bin/env python3
"""
Migration script to add location fields to the messages table
"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import mysql.connector
from mysql.connector import Error

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

def migrate_location_fields():
    """Add location fields to messages table if they don't exist"""
    try:
        # Create connection using mysql.connector
        connection = mysql.connector.connect(
            host=DB_HOST,
            port=int(DB_PORT),
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            # Check if messages table exists
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.tables 
                WHERE table_schema = %s AND table_name = 'messages'
            """, (DB_NAME,))
            
            table_exists = cursor.fetchone()[0] > 0
            
            if not table_exists:
                print("Messages table does not exist. Creating all tables...")
                # If table doesn't exist, create all tables using SQLAlchemy
                from app.db.database import Base, engine
                Base.metadata.create_all(bind=engine)
                print("All tables created successfully!")
                return
            
            # Check if location columns already exist
            cursor.execute("""
                SELECT COLUMN_NAME 
                FROM information_schema.columns 
                WHERE table_schema = %s AND table_name = 'messages'
                AND COLUMN_NAME IN ('latitude', 'longitude', 'location_address')
            """, (DB_NAME,))
            
            existing_columns = [row[0] for row in cursor.fetchall()]
            
            columns_to_add = []
            if 'latitude' not in existing_columns:
                columns_to_add.append("ADD COLUMN latitude VARCHAR(50) NULL")
            if 'longitude' not in existing_columns:
                columns_to_add.append("ADD COLUMN longitude VARCHAR(50) NULL")
            if 'location_address' not in existing_columns:
                columns_to_add.append("ADD COLUMN location_address TEXT NULL")
            
            if columns_to_add:
                # Add the missing columns
                alter_query = f"ALTER TABLE messages {', '.join(columns_to_add)}"
                cursor.execute(alter_query)
                connection.commit()
                print(f"Added location columns to messages table: {', '.join([col.split()[-2] for col in columns_to_add])}")
            else:
                print("All location columns already exist in messages table!")
                
            # Also check and update the message_type enum if needed
            cursor.execute("""
                SELECT COLUMN_TYPE 
                FROM information_schema.columns 
                WHERE table_schema = %s AND table_name = 'messages' AND column_name = 'message_type'
            """, (DB_NAME,))
            
            result = cursor.fetchone()
            if result:
                column_type = result[0]
                if 'location' not in column_type:
                    print("Adding 'location' to message_type enum...")
                    cursor.execute("""
                        ALTER TABLE messages 
                        MODIFY COLUMN message_type ENUM('text', 'image', 'file', 'location', 'system') 
                        DEFAULT 'text'
                    """)
                    connection.commit()
                    print("Updated message_type enum to include 'location'")
                else:
                    print("message_type enum already includes 'location'")
            
            cursor.close()
            
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error during migration: {e}")
        sys.exit(1)
    finally:
        if connection and connection.is_connected():
            connection.close()
            print("Database connection closed.")

if __name__ == "__main__":
    print("Starting location fields migration...")
    migrate_location_fields()
    print("Migration completed successfully!")
