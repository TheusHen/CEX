import pytest

def test_root(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json == {"online": True}

def test_get_airports(client, mocker):
    mock_response = type("Resp", (), {"data": [{"airport_id": "1"}], "error": None})()
    mocker.patch("utils.supabase.supabase.table", return_value=mocker.Mock(
        select=lambda *a, **kw: mocker.Mock(
            execute=lambda: mock_response
        )
    ))
    resp = client.get("/api/airports")
    assert resp.status_code == 200
    assert isinstance(resp.json, list)

def test_get_airport(client, mocker):
    mock_response = type("Resp", (), {"data": {"airport_id": "1"}, "error": None})()
    mocker.patch("utils.supabase.supabase.table", return_value=mocker.Mock(
        select=lambda *a, **kw: mocker.Mock(
            eq=lambda *a, **kw: mocker.Mock(
                single=lambda: mocker.Mock(
                    execute=lambda: mock_response
                )
            )
        )
    ))
    resp = client.get("/api/airports/GRU")
    assert resp.status_code == 200
    assert "airport_id" in resp.json

def test_search_airports_empty(client, mocker):
    mock_response = type("Resp", (), {"data": [], "error": None})()
    mocker.patch("utils.supabase.supabase.table", return_value=mocker.Mock(
        select=lambda *a, **kw: mocker.Mock(
            ilike=lambda *a, **kw: mocker.Mock(
                order=lambda *a, **kw: mocker.Mock(
                    execute=lambda: mock_response
                )
            )
        )
    ))
    resp = client.get("/api/airports/search/teste")
    assert resp.status_code == 200
    assert resp.json == []

def test_create_cex_no_json(client):
    resp = client.post("/api/cex", data="notjson", content_type="application/json")
    assert resp.status_code == 400
    # Só tente ler JSON se a resposta for JSON
    if resp.is_json:
        data = resp.get_json()
        assert data is not None
        assert "error" in data
    else:
        # Esperado: resposta padrão do Flask para erro 400
        assert b"Bad Request" in resp.data
