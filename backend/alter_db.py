import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(".env")
engine = create_engine(os.getenv("DATABASE_URL"))
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE posts ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;"))
        conn.commit()
        print("Column added successfully.")
    except Exception as e:
        print("Error or already exists:", e)
