import pytest
from main import app

@pytest.fixture
def client():
    with app.test_client() as c:
        yield c
