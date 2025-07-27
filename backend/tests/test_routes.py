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
    resp = client.get("/api/airports/1")  # Corrigido endpoint
    assert resp.status_code == 200
    assert "airport_id" in resp.json

def test_search_airports_empty(client):
    resp = client.get("/api/airports/search/")  # Corrigido endpoint para search
    assert resp.status_code == 200
    assert resp.json == []

def test_create_cex_no_json(client):
    resp = client.post("/api/cex", data="notjson", content_type="application/json")
    assert resp.status_code == 400
    assert "error" in resp.json

