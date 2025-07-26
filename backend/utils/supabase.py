import os
from supabase import create_client, Client

SUPABASE_URL: str = os.environ.get("SUPABASE_URL")
SUPABASE_KEY: str = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        "Environment variables SUPABASE_URL and SUPABASE_KEY must be set!"
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def raise_when_api_error(response):
    if hasattr(response, "error") and response.error:
        raise Exception(f"API Error: {response.error}")

