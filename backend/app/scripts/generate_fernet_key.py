"""Generate a Fernet encryption key for KIMUX_FERNET_KEY.

Usage:
    cd backend
    python -m app.scripts.generate_fernet_key

Copy the printed key into your .env file as:
    KIMUX_FERNET_KEY=<the printed value>

Never commit this key to version control.
"""
from cryptography.fernet import Fernet

if __name__ == "__main__":
    key = Fernet.generate_key().decode()
    print(key)
    print("\nAdd to your .env file:")
    print(f"KIMUX_FERNET_KEY={key}")
