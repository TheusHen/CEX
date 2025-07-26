# CEX API Documentation

## Base URL

```
https://api.cex.theushen.me/api
```

---

## POST `/api/cex`

Calculate and save CEX score for an airport.

**Body (JSON):**
- `Sp`, `Ac`, `Da`, `Zl`, `To`, `Ng`, `Rt`, `Pm`, `Va`, `Id`, `Sc`, `Lu`: *number* (required)
- `iata`: *string* (required)
- `airport`: *string* (required)

**Response:**
```json
{
  "iata": "GRU",
  "airport": "São Paulo/Guarulhos",
  "C": 7.25,
  "E": 8.00,
  "X": 6.75,
  "CEX": 7.33
}
```

---

## GET `/api/airports`

Get all ratings for all airports.

**Response:**
```json
[
  {
    "iata": "GRU",
    "airport": "São Paulo/Guarulhos",
    "comfort": 7.25,
    "efficiency": 8.00,
    "aesthetics": 6.75,
    "cex": 7.33
  },
  // ...
]
```

---

## GET `/api/airports/:iata`

Get ratings for a specific airport by IATA code.

**Params:**
- `iata`: *string* (IATA code)

**Response:**
```json
{
  "iata": "GRU",
  "airport": "São Paulo/Guarulhos",
  "comfort": 7.25,
  "efficiency": 8.00,
  "aesthetics": 6.75,
  "cex": 7.33
}
```

---

## GET `/api/airports/order/desc`

Get all airports ordered by CEX score (highest to lowest).

---

## GET `/api/airports/order/asc`

Get all airports ordered by CEX score (lowest to highest).

---

## GET `/api/airports/search/:name`

Search airports by (partial) name.

**Params:**
- `name`: *string* (partial or full airport name)

---

## GET `/api/airports/cex/above/:value`

Get airports with CEX score above a value.

**Params:**
- `value`: *number*

---

## GET `/api/airports/cex/below/:value`

Get airports with CEX score below a value.

**Params:**
- `value`: *number*

---

## Error Responses

All endpoints may return errors in the following format:
```json
{ "error": "Error message" }
```
