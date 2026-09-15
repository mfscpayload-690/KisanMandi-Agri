#!/usr/bin/env bash
set -e

echo "=== Running Hurl API Integration Tests ==="
hurl --test tests/api_tests.hurl

echo ""
echo "=== Running Pytest Unit & Contract Tests ==="
.venv/bin/pytest tests/test_api.py -v
