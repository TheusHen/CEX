import pytest
from backend.main import app  # Corrigido para import absoluto com base no pacote

@pytest.fixture
def client():
    with app.test_client() as c:
        yield c

