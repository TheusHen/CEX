import pytest
from utils.supabase import raise_when_api_error

def test_raise_when_api_error_no_error():
    class Resp:
        error = None
    raise_when_api_error(Resp())  # Não deve lançar

def test_raise_when_api_error_with_error():
    class Resp:
        error = "some error"
    with pytest.raises(Exception) as exc:
        raise_when_api_error(Resp())
    assert "API Error" in str(exc.value)
