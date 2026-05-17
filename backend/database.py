"""
Database utilities for Supabase connection
"""
from supabase import create_client, Client
from config import get_settings
from typing import Optional

_db_instance: Optional[Client] = None


def get_db() -> Client:
    """Get Supabase database connection"""
    global _db_instance
    if _db_instance is None:
        settings = get_settings()
        _db_instance = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY
        )
    return _db_instance


def get_db_admin() -> Client:
    """Get Supabase database connection with service role key"""
    settings = get_settings()
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )
