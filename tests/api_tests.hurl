# ==============================================================================
# Farmer Market Price Discovery Platform - Hurl API Test Suite
# Tests all 8 core API endpoints, latency bounds (<500ms), and error scenarios
# ==============================================================================

# 1. Health Check
GET http://localhost:8000/health
HTTP 200
[Asserts]
duration < 500
jsonpath "$.status" == "healthy"

# 2. Endpoint (a): Prices with Filters & Latency Check
GET http://localhost:8000/api/v1/prices?crop=wheat&state=maharashtra&days=30&limit=5
HTTP 200
[Asserts]
duration < 500
header "X-Process-Time-Ms" exists
jsonpath "$.total" > 0
jsonpath "$.page" == 1
jsonpath "$.limit" == 5
jsonpath "$.data[0].crop_name" == "Wheat"
jsonpath "$.data[0].state" == "Maharashtra"
jsonpath "$.data[0].price_per_unit" > 0

# 3. Endpoint (b): Mandi Directory
GET http://localhost:8000/api/v1/mandis
HTTP 200
[Asserts]
duration < 500
jsonpath "$" count >= 10
[Captures]
sample_mandi_id: jsonpath "$[0].id"
sample_mandi_name: jsonpath "$[0].name"

# 4. Endpoint (c): Mandi Prices by Mandi ID
GET http://localhost:8000/api/v1/mandis/{{sample_mandi_id}}/prices?days=30
HTTP 200
[Asserts]
duration < 500
jsonpath "$.mandi.id" == {{sample_mandi_id}}
jsonpath "$.mandi.name" == "{{sample_mandi_name}}"
jsonpath "$.total_records" >= 0

# 5. Endpoint (c) Error Handling: Non-existent Mandi ID
GET http://localhost:8000/api/v1/mandis/999999/prices
HTTP 404
[Asserts]
duration < 500
jsonpath "$.detail" contains "not found"

# 6. Endpoint (d): Crop Price Trends & Moving Aggregations
GET http://localhost:8000/api/v1/trends/Wheat?state=punjab&days=30
HTTP 200
[Asserts]
duration < 500
jsonpath "$.crop" == "Wheat"
jsonpath "$.days" == 30
jsonpath "$.overall_avg" > 0
jsonpath "$.overall_min" > 0
jsonpath "$.overall_max" > 0
jsonpath "$.data" count > 0

# 7. Endpoint (e): Buyer Directory
GET http://localhost:8000/api/v1/buyers?crop=wheat
HTTP 200
[Asserts]
duration < 500
jsonpath "$" count > 0
jsonpath "$[0].crop" == "Wheat"
jsonpath "$[0].contact" exists

# 8. Endpoint (f): Create Price Alert
POST http://localhost:8000/api/v1/alerts
Content-Type: application/json
{
  "user_id": "farmer_hurl_qa",
  "crop": "Wheat",
  "threshold_price": 2500.0,
  "alert_type": "above"
}
HTTP 201
[Asserts]
duration < 500
jsonpath "$.user_id" == "farmer_hurl_qa"
jsonpath "$.crop" == "Wheat"
jsonpath "$.threshold_price" == 2500.0
jsonpath "$.alert_type" == "above"
[Captures]
hurl_alert_id: jsonpath "$.id"

# 9. Endpoint (g): Get User Alerts
GET http://localhost:8000/api/v1/alerts/farmer_hurl_qa
HTTP 200
[Asserts]
duration < 500
jsonpath "$" count > 0
jsonpath "$[0].user_id" == "farmer_hurl_qa"
jsonpath "$[0].id" == {{hurl_alert_id}}

# 10. Delete Alert Cleanup
DELETE http://localhost:8000/api/v1/alerts/{{hurl_alert_id}}
HTTP 200
[Asserts]
duration < 500
jsonpath "$.message" == "Alert deleted successfully"

# 11. Endpoint (h): High-Level Market Statistics
GET http://localhost:8000/api/v1/stats
HTTP 200
[Asserts]
duration < 500
jsonpath "$.total_price_records" >= 100000
jsonpath "$.total_mandis" >= 1000
jsonpath "$.total_crops" >= 5
jsonpath "$.states_covered" count >= 20
jsonpath "$.top_traded_crops" count > 0

# 12. Helper Endpoint: Crop List for Dropdowns
GET http://localhost:8000/api/v1/crops
HTTP 200
[Asserts]
duration < 500
jsonpath "$" count >= 5

# 13. Sync Status Check
GET http://localhost:8000/api/v1/sync/status
HTTP 200
[Asserts]
duration < 500
jsonpath "$.total_ingested_reports" >= 10

# 14. Trigger Incremental Sync
POST http://localhost:8000/api/v1/sync
HTTP 200
[Asserts]
duration < 1000
jsonpath "$.status" exists
