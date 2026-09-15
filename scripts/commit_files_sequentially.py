#!/usr/bin/env python3
"""
Sequential Git Committer: 1 file per commit
Ensures clean commit history and maximizes GitHub contribution graph.
"""

import subprocess
import sys
from pathlib import Path

COMMITS = [
    # Base setup
    (".gitignore", "chore: configure comprehensive gitignore for backend, frontend and databases"),
    ("README.md", "docs: add project documentation, architecture diagram, and quickstart guide"),
    ("requirements.txt", "build: add python dependencies for FastAPI backend"),
    ("main.py", "feat(backend): add root uvicorn entrypoint for port 8000"),
    ("seed_data.py", "feat(backend): add high-performance AgMarkNet and Kaggle dataset seeder"),
    ("test.sh", "test: add unified test runner for Hurl and Pytest suites"),
    ("scripts/generate_sample_csv.py", "scripts: add AgMarkNet sample dataset generator"),
    ("scripts/commit_files_sequentially.py", "scripts: add sequential atomic file committer script"),

    # Backend core
    ("backend/app/__init__.py", "feat(backend): initialize backend application package"),
    ("backend/app/database.py", "feat(backend): configure SQLite engine and session dependency"),
    ("backend/app/models.py", "feat(backend): define SQLAlchemy models for prices, mandis, crops, buyers, and alerts"),
    ("backend/app/schemas.py", "feat(backend): define Pydantic v2 validation and response schemas"),
    ("backend/app/crud.py", "feat(backend): implement optimized queries, dynamic filters, and aggregations"),
    ("backend/app/services/cache.py", "feat(backend): implement in-memory TTL cache for high-frequency polling"),
    ("backend/app/services/ingestion.py", "feat(backend): implement multi-threaded incremental CSV ingestion and file watcher"),
    ("backend/app/routers/__init__.py", "feat(backend): initialize API routers package"),
    ("backend/app/routers/prices.py", "feat(backend): add /api/v1/prices and /api/v1/crops endpoints"),
    ("backend/app/routers/mandis.py", "feat(backend): add /api/v1/mandis and mandi prices endpoints"),
    ("backend/app/routers/trends.py", "feat(backend): add /api/v1/trends historical price trend endpoint"),
    ("backend/app/routers/buyers.py", "feat(backend): add /api/v1/buyers verified aggregator directory endpoint"),
    ("backend/app/routers/alerts.py", "feat(backend): add /api/v1/alerts price threshold notification endpoints"),
    ("backend/app/routers/stats.py", "feat(backend): add /api/v1/stats high-level market metrics endpoint"),
    ("backend/app/routers/sync.py", "feat(backend): add /api/v1/sync manual trigger and status endpoints"),
    ("backend/app/main.py", "feat(backend): configure FastAPI app with CORS, lifespan, and routers"),

    # Tests
    ("tests/api_tests.hurl", "test: add comprehensive 14-step Hurl integration test suite"),
    ("tests/test_api.py", "test: add pytest unit and contract tests for core endpoints"),

    # Data files
    ("data/market_prices.csv", "data: add baseline market arrivals dataset"),
    ("data/Commodity-wise_Market-wise_Daily_Weighted_Avg_Report_15-09-2026_08-55-49_PM.csv", "data: add AgMarkNet daily report for Sep 13, 2026"),
    ("data/Commodity-wise_Market-wise_Daily_Weighted_Avg_Report_15-09-2026_10-04-26_PM.csv", "data: add AgMarkNet daily report for Sep 12, 2026"),
    ("data/Commodity-wise_Market-wise_Daily_Weighted_Avg_Report_15-09-2026_10-10-37_PM.csv", "data: add AgMarkNet daily report for Sep 11, 2026"),
    ("data/Commodity-wise_Market-wise_Daily_Weighted_Avg_Report_15-09-2026_10-15-14_PM.csv", "data: add AgMarkNet daily report for Sep 10, 2026"),
    ("data/Commodity-wise_Market-wise_Daily_Weighted_Avg_Report_15-09-2026_10-15-33_PM.csv", "data: add AgMarkNet daily report for Sep 09, 2026"),
    ("data/Commodity-wise_Market-wise_Daily_Weighted_Avg_Report_15-09-2026_10-21-14_PM.csv", "data: add AgMarkNet daily report for Sep 08, 2026"),
    ("data/Commodity-wise_Market-wise_Daily_Weighted_Avg_Report_15-09-2026_10-21-31_PM.csv", "data: add AgMarkNet daily report for Sep 07, 2026"),
    ("data/Commodity-wise_Market-wise_Daily_Weighted_Avg_Report_15-09-2026_10-23-20_PM.csv", "data: add AgMarkNet daily report for Sep 06, 2026"),
    ("data/Commodity-wise_Market-wise_Daily_Weighted_Avg_Report_15-09-2026_10-46-26_PM.csv", "data: add AgMarkNet daily report for Sep 05, 2026"),
    ("data/Commodity-wise_Market-wise_Daily_Weighted_Avg_Report_15-09-2026_10-49-45_PM.csv", "data: add AgMarkNet daily report for Sep 04, 2026"),
    ("data/Commodity-wise_Market-wise_Daily_Weighted_Avg_Report_15-09-2026_10-53-22_PM.csv", "data: add AgMarkNet daily report for Sep 03, 2026"),
    ("data/Commodity-wise_Market-wise_Daily_Weighted_Avg_Report_15-09-2026_11-03-12_PM.csv", "data: add AgMarkNet daily report for Sep 02, 2026"),
    ("data/Commodity-wise_Market-wise_Daily_Weighted_Avg_Report_15-09-2026_11-04-05_PM.csv", "data: add AgMarkNet daily report for Sep 01, 2026"),
    ("data/Agriculture_price_dataset.csv", "data: add 2-year Kaggle AgMarkNet agricultural price dataset"),

    # Frontend configs & assets
    ("frontend/.gitignore", "chore(frontend): configure frontend gitignore"),
    ("frontend/.oxlintrc.json", "chore(frontend): configure oxlint linter"),
    ("frontend/README.md", "docs(frontend): add frontend documentation"),
    ("frontend/package.json", "build(frontend): add frontend dependencies and build scripts"),
    ("frontend/package-lock.json", "build(frontend): add package lockfile"),
    ("frontend/tsconfig.json", "chore(frontend): configure root TypeScript configuration"),
    ("frontend/tsconfig.app.json", "chore(frontend): configure app TypeScript configuration"),
    ("frontend/tsconfig.node.json", "chore(frontend): configure node TypeScript configuration"),
    ("frontend/vite.config.ts", "build(frontend): configure Vite with Tailwind v4 and proxy"),
    ("frontend/index.html", "feat(frontend): set up HTML entrypoint with metadata and mobile viewport"),
    ("frontend/public/favicon.svg", "feat(frontend): add favicon icon"),
    ("frontend/public/icons.svg", "feat(frontend): add public SVG icons"),
    ("frontend/src/assets/hero.png", "feat(frontend): add hero visual asset"),
    ("frontend/src/assets/react.svg", "feat(frontend): add React asset"),
    ("frontend/src/assets/vite.svg", "feat(frontend): add Vite asset"),
    ("frontend/src/index.css", "feat(frontend): configure Tailwind CSS and design tokens"),
    ("frontend/src/App.css", "feat(frontend): add custom app utility styles"),

    # Frontend code
    ("frontend/src/api/client.ts", "feat(frontend): implement API client and typed data contracts"),
    ("frontend/src/i18n/translations.ts", "feat(frontend): implement 6 Indian language translations dictionary"),
    ("frontend/src/context/LanguageContext.tsx", "feat(frontend): create reactive language state provider"),
    ("frontend/src/components/Header.tsx", "feat(frontend): build header with live pulse and language switcher"),
    ("frontend/src/components/BottomNav.tsx", "feat(frontend): build mobile thumb navigation bar"),
    ("frontend/src/components/StatsTicker.tsx", "feat(frontend): build live metrics ticker and crop filter pills"),
    ("frontend/src/components/DashboardPage.tsx", "feat(frontend): build market arrivals and price discovery dashboard"),
    ("frontend/src/components/TrendsPage.tsx", "feat(frontend): build interactive price trend chart component"),
    ("frontend/src/components/BuyersPage.tsx", "feat(frontend): build verified buyer directory with call and WhatsApp links"),
    ("frontend/src/components/AlertsPage.tsx", "feat(frontend): build farmer price threshold alert component"),
    ("frontend/src/components/Footer.tsx", "feat(frontend): build footer with AgMarkNet attribution"),
    ("frontend/src/App.tsx", "feat(frontend): assemble application with 5s polling and routing"),
    ("frontend/src/main.tsx", "feat(frontend): mount React 19 application root"),
]

def run():
    print(f"Starting sequential commit of {len(COMMITS)} files...")
    
    # Ensure on main branch
    subprocess.run(["git", "checkout", "-B", "main"], check=True)

    committed = 0
    for filepath, message in COMMITS:
        p = Path(filepath)
        if not p.exists():
            print(f"Warning: File {filepath} not found, skipping...")
            continue
            
        # Stage single file
        subprocess.run(["git", "add", filepath], check=True)
        
        # Commit single file
        res = subprocess.run(["git", "commit", "-m", message], capture_output=True, text=True)
        if res.returncode == 0:
            committed += 1
            print(f"[{committed}/{len(COMMITS)}] Committed: {filepath}")
        else:
            print(f"Skipped/Empty: {filepath} ({res.stderr.strip()})")

    # Check for any remaining untracked files
    status = subprocess.run(["git", "status", "-s"], capture_output=True, text=True).stdout.strip()
    if status:
        print("\nRemaining untracked files:")
        print(status)
        for line in status.split("\n"):
            parts = line.strip().split()
            if len(parts) >= 2:
                f = parts[-1]
                subprocess.run(["git", "add", f], check=True)
                subprocess.run(["git", "commit", "-m", f"chore: add {f}"], check=True)
                committed += 1
                print(f"Committed remaining: {f}")

    print(f"\nCompleted! Total commits created: {committed}")

if __name__ == "__main__":
    run()
