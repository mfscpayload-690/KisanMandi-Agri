#!/usr/bin/env python3
"""
High-Performance Real AgMarkNet & Kaggle Data Seeder
Ingests:
  1. Official Government Daily Reports: data/Commodity-wise_Market-wise_Daily_Weighted_Avg_Report_*.csv (Sep 2026)
  2. 2-Year Kaggle AgMarkNet Dataset: data/Agriculture_price_dataset.csv (737k+ records, 2023-2025)
Populates:
  - prices (enriched with modal_price, min_price, max_price, variety)
  - mandis (dynamically extracted from real markets)
  - crops (dynamically computed bounds)
  - buyers & price_alerts
"""

import os
import re
import sys
import glob
import time
import sqlite3
import logging
import argparse
from pathlib import Path
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("seed_data")

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "market_data.db"

COMMODITY_MAP = {
    "paddy": "Rice (Paddy)",
    "rice": "Rice (Paddy)",
    "paddy(dhan)(common)": "Rice (Paddy)",
    "paddy(dhan)(basmati)": "Rice (Paddy)",
    "wheat": "Wheat",
    "onion": "Onion",
    "tomato": "Tomato",
    "potato": "Potato",
    "maize": "Maize",
    "red gram/arhar/tur": "Tur / Arhar (Red Gram)",
    "arhar (tur/red gram)(whole)": "Tur / Arhar (Red Gram)",
    "cotton": "Cotton",
    "soyabean": "Soybean",
    "soybean": "Soybean",
    "mustard": "Mustard",
    "gram raw(chhana)": "Gram (Chana)",
    "bengal gram(gram)(whole)": "Gram (Chana)",
}

SAMPLE_BUYERS = [
    {"name": "ITC e-Choupal Agri Procurement", "crop": "Wheat", "min_quantity": 50.0, "location": "Madhya Pradesh", "contact": "+91 731 2800100"},
    {"name": "Cargill India Grains Hub", "crop": "Soybean", "min_quantity": 100.0, "location": "Maharashtra", "contact": "+91 22 66789000"},
    {"name": "Adani Wilmar Agri Hub", "crop": "Mustard", "min_quantity": 75.0, "location": "Gujarat", "contact": "+91 79 26565555"},
    {"name": "Punjab Agro Industries Corp", "crop": "Wheat", "min_quantity": 120.0, "location": "Punjab", "contact": "+91 172 2771122"},
    {"name": "Reliance Fresh Sourcing Direct", "crop": "Tomato", "min_quantity": 25.0, "location": "Karnataka", "contact": "+91 80 41102000"},
    {"name": "Maharashtra State Onion Federation", "crop": "Onion", "min_quantity": 40.0, "location": "Maharashtra", "contact": "+91 253 2577889"},
    {"name": "Mother Dairy / Safal Retail", "crop": "Potato", "min_quantity": 30.0, "location": "Delhi", "contact": "+91 11 22441010"},
    {"name": "Cotton Corporation of India (CCI)", "crop": "Cotton", "min_quantity": 50.0, "location": "Maharashtra", "contact": "+91 712 2541090"},
    {"name": "Haldiram Snack Foods Procurement", "crop": "Gram (Chana)", "min_quantity": 60.0, "location": "Uttar Pradesh", "contact": "+91 120 4567890"},
    {"name": "Godrej Agrovet Animal Feed", "crop": "Maize", "min_quantity": 80.0, "location": "Punjab", "contact": "+91 161 2456789"},
    {"name": "BigBasket Farm Direct Supply", "crop": "Tomato", "min_quantity": 15.0, "location": "Karnataka", "contact": "+91 80 67890123"},
    {"name": "Lalithaa Grain Merchants", "crop": "Rice (Paddy)", "min_quantity": 100.0, "location": "Delhi", "contact": "+91 11 23864500"},
    {"name": "Tata Consumer Products Sourcing", "crop": "Tur / Arhar (Red Gram)", "min_quantity": 60.0, "location": "Maharashtra", "contact": "+91 22 66658282"},
]

SAMPLE_ALERTS = [
    {"user_id": "farmer_ramesh", "crop": "Wheat", "threshold_price": 2450.0, "alert_type": "above"},
    {"user_id": "farmer_ramesh", "crop": "Onion", "threshold_price": 2200.0, "alert_type": "below"},
    {"user_id": "farmer_priya", "crop": "Tomato", "threshold_price": 2100.0, "alert_type": "above"},
    {"user_id": "farmer_gurpreet", "crop": "Maize", "threshold_price": 2300.0, "alert_type": "above"},
]

def normalize_crop(raw_name: str) -> str:
    cleaned = raw_name.strip()
    key = cleaned.lower()
    return COMMODITY_MAP.get(key, cleaned.title())

STATE_CANONICAL_MAP = {
    "andaman and nicobar": "Andaman and Nicobar Islands",
    "andaman and nicobar islands": "Andaman and Nicobar Islands",
    "andaman & nicobar": "Andaman and Nicobar Islands",
    "chattisgarh": "Chhattisgarh",
    "chhattisgarh": "Chhattisgarh",
    "delhi": "Delhi",
    "nct of delhi": "Delhi",
    "gao": "Goa",
    "goa": "Goa",
    "jammu & kashmir": "Jammu and Kashmir",
    "jammu and kashmir": "Jammu and Kashmir",
    "kerala": "Kerala",
    "keralam": "Kerala",
    "odisha": "Odisha",
    "orissa": "Odisha",
    "pondicherry": "Puducherry",
    "puducherry": "Puducherry",
    "tamil nadu": "Tamil Nadu",
    "tamilnadu": "Tamil Nadu",
    "uttarakhand": "Uttarakhand",
    "uttrakhand": "Uttarakhand",
}

def normalize_state(raw_name: str) -> str:
    if not raw_name:
        return "Unknown"
    cleaned = raw_name.strip()
    key = cleaned.lower()
    return STATE_CANONICAL_MAP.get(key, cleaned.title())

def parse_kaggle_date(d_str: str) -> str:
    d_str = d_str.strip()
    if "/" in d_str:
        parts = d_str.split("/")
        if len(parts) == 3:
            m, d, y = parts
            return f"{int(y):04d}-{int(m):02d}-{int(d):02d}"
    return d_str

def parse_report_file(filepath: Path):
    """Parses an official AgMarkNet government daily report CSV file."""
    records = []
    with open(filepath, mode="r", encoding="utf-8", errors="ignore") as f:
        date_str = None
        current_commodity = None
        current_state = None

        for line in f:
            line = line.strip()
            if not line:
                continue

            if "Daily Report (Weighted Average) on:" in line:
                m = re.search(r"on:\s*([0-9]{1,2}-[A-Za-z]{3}-[0-9]{4})", line)
                if m:
                    dt = datetime.strptime(m.group(1), "%d-%b-%Y")
                    date_str = dt.strftime("%Y-%m-%d")
            elif "State/UT Name :" in line:
                raw_st = line.split("State/UT Name :")[1].strip()
                current_state = normalize_state(raw_st)
            elif "(MSP:" in line or "Commodity :" in line:
                raw_c = line.split("(")[0].strip()
                current_commodity = normalize_crop(raw_c)
            elif "Market Center," in line or "Commodity Group Name :" in line or "Total" in line:
                continue
            else:
                parts = [p.strip() for p in line.split(",")]
                if len(parts) >= 7 and parts[0] and current_state and current_commodity and date_str:
                    mandi_name = parts[0]
                    try:
                        arrivals_raw = float(parts[1]) if parts[1] else 0.0
                        unit_arrivals = parts[2].lower() if len(parts) > 2 else "metric tonnes"
                        # Standardize quantity to Quintals: 1 Metric Tonne = 10 Quintals
                        quantity = arrivals_raw * 10.0 if "tonne" in unit_arrivals else arrivals_raw
                        
                        variety = parts[3] if len(parts) > 3 and parts[3] else "FAQ"
                        min_p = float(parts[4]) if parts[4] else 0.0
                        max_p = float(parts[5]) if parts[5] else 0.0
                        modal_p = float(parts[6]) if parts[6] else 0.0

                        if modal_p <= 0 and min_p > 0:
                            modal_p = (min_p + max_p) / 2.0 if max_p > 0 else min_p
                        if modal_p > 0:
                            records.append((
                                current_commodity,
                                mandi_name,
                                modal_p,       # price_per_unit
                                modal_p,       # modal_price
                                min_p or modal_p, # min_price
                                max_p or modal_p, # max_price
                                variety,
                                round(quantity, 1),
                                date_str,
                                current_state,
                                current_state, # region/district fallback
                                f"{date_str} 00:00:00"
                            ))
                    except Exception:
                        pass
    return records

def init_schema(conn: sqlite3.Connection):
    """Creates database schema and optimized indexes."""
    conn.execute("DROP TABLE IF EXISTS prices")
    conn.execute("DROP TABLE IF EXISTS mandis")
    conn.execute("DROP TABLE IF EXISTS crops")
    conn.execute("DROP TABLE IF EXISTS buyers")
    conn.execute("DROP TABLE IF EXISTS price_alerts")

    conn.execute("""
    CREATE TABLE prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        crop_name TEXT NOT NULL,
        mandi_name TEXT NOT NULL,
        price_per_unit REAL NOT NULL,
        modal_price REAL,
        min_price REAL,
        max_price REAL,
        variety TEXT,
        quantity REAL NOT NULL DEFAULT 0.0,
        date TEXT NOT NULL,
        state TEXT NOT NULL,
        region TEXT,
        created_at TEXT
    )
    """)

    conn.execute("""
    CREATE TABLE mandis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        state TEXT NOT NULL,
        district TEXT NOT NULL,
        contact TEXT
    )
    """)

    conn.execute("""
    CREATE TABLE crops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        unit_of_measurement TEXT NOT NULL DEFAULT 'Quintal',
        min_price REAL,
        max_price REAL
    )
    """)

    conn.execute("""
    CREATE TABLE buyers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        crop TEXT NOT NULL,
        min_quantity REAL NOT NULL,
        location TEXT NOT NULL,
        contact TEXT NOT NULL
    )
    """)

    conn.execute("""
    CREATE TABLE price_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        crop TEXT NOT NULL,
        threshold_price REAL NOT NULL,
        alert_type TEXT NOT NULL,
        created_at TEXT
    )
    """)

    conn.commit()

def create_indexes(conn: sqlite3.Connection):
    """Build composite indices on prices and lookup tables."""
    logger.info("Building database indexes...")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_prices_crop_state_date ON prices (crop_name, state, date)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_prices_crop_date ON prices (crop_name, date)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_prices_mandi_date ON prices (mandi_name, date)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_prices_date ON prices (date)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_mandis_name ON mandis (name)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_mandis_state ON mandis (state)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_crops_name ON crops (name)")
    conn.commit()

def seed():
    start_total = time.time()
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    # Enable high-throughput pragma settings
    conn.execute("PRAGMA synchronous = OFF")
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA cache_size = 50000")

    init_schema(conn)

    # 1. Ingest Official AgMarkNet Daily Reports (Sep 2026)
    report_files = sorted(glob.glob(str(DATA_DIR / "Commodity-wise_Market-wise_Daily_Weighted_Avg_Report_*.csv")))
    logger.info(f"Found {len(report_files)} official AgMarkNet daily report files.")
    
    report_records = []
    for rf in report_files:
        parsed = parse_report_file(Path(rf))
        report_records.extend(parsed)
        logger.info(f"  Parsed {len(parsed)} records from {Path(rf).name}")

    if report_records:
        conn.executemany("""
            INSERT INTO prices (crop_name, mandi_name, price_per_unit, modal_price, min_price, max_price, variety, quantity, date, state, region, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, report_records)
        conn.commit()
        logger.info(f"Successfully inserted {len(report_records)} records from official AgMarkNet reports.")

    # 2. Ingest Kaggle 2-Year AgMarkNet Dataset (737k+ records, 2023-2025)
    kaggle_path = DATA_DIR / "Agriculture_price_dataset.csv"
    if kaggle_path.exists():
        logger.info(f"Ingesting Kaggle 2-year AgMarkNet dataset from {kaggle_path.name}...")
        kaggle_count = 0
        batch = []
        batch_size = 50000

        with open(kaggle_path, mode="r", encoding="utf-8", errors="ignore") as f:
            header = f.readline().strip().split(",")
            # STATE,District Name,Market Name,Commodity,Variety,Grade,Min_Price,Max_Price,Modal_Price,Price Date
            
            for line in f:
                line = line.strip()
                if not line:
                    continue
                parts = line.split(",")
                if len(parts) >= 10:
                    state = normalize_state(parts[0].strip())
                    district = parts[1].strip().title()
                    mandi = parts[2].strip()
                    raw_commodity = parts[3].strip()
                    crop = normalize_crop(raw_commodity)
                    variety = parts[4].strip() or "FAQ"
                    # grade = parts[5].strip()
                    try:
                        min_p = float(parts[6]) if parts[6] else 0.0
                        max_p = float(parts[7]) if parts[7] else 0.0
                        modal_p = float(parts[8]) if parts[8] else 0.0
                        date_str = parse_kaggle_date(parts[9])

                        if modal_p <= 0 and min_p > 0:
                            modal_p = (min_p + max_p) / 2.0 if max_p > 0 else min_p

                        if modal_p > 0:
                            batch.append((
                                crop,
                                mandi,
                                modal_p,       # price_per_unit
                                modal_p,       # modal_price
                                min_p or modal_p,
                                max_p or modal_p,
                                variety,
                                50.0,          # default estimated quantity
                                date_str,
                                state,
                                district,
                                f"{date_str} 00:00:00"
                            ))
                            kaggle_count += 1
                    except Exception:
                        pass

                if len(batch) >= batch_size:
                    conn.executemany("""
                        INSERT INTO prices (crop_name, mandi_name, price_per_unit, modal_price, min_price, max_price, variety, quantity, date, state, region, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, batch)
                    conn.commit()
                    batch.clear()
                    logger.info(f"  Inserted {kaggle_count} Kaggle records...")

            if batch:
                conn.executemany("""
                    INSERT INTO prices (crop_name, mandi_name, price_per_unit, modal_price, min_price, max_price, variety, quantity, date, state, region, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, batch)
                conn.commit()
                batch.clear()

        logger.info(f"Finished ingesting {kaggle_count} records from Kaggle dataset.")

    # 3. Dynamically Populate Unique Mandis Directory
    logger.info("Extracting unique Mandis from real dataset...")
    conn.execute("""
        INSERT OR IGNORE INTO mandis (name, state, district, contact)
        SELECT mandi_name, state, COALESCE(region, state), '+91 11 ' || (abs(random()) % 9000000 + 1000000)
        FROM prices
        GROUP BY mandi_name
    """)
    conn.commit()
    mandi_count = conn.execute("SELECT COUNT(*) FROM mandis").fetchone()[0]
    logger.info(f"Populated {mandi_count} unique APMC Mandis.")

    # 4. Dynamically Populate Unique Crops Master
    logger.info("Computing crop bounds and master registry...")
    conn.execute("""
        INSERT OR IGNORE INTO crops (name, unit_of_measurement, min_price, max_price)
        SELECT crop_name, 'Quintal', ROUND(MIN(min_price), 2), ROUND(MAX(max_price), 2)
        FROM prices
        GROUP BY crop_name
    """)
    conn.commit()
    crop_count = conn.execute("SELECT COUNT(*) FROM crops").fetchone()[0]
    logger.info(f"Populated {crop_count} unique Crops.")

    # 5. Populate Verified Buyers
    buyer_tuples = [(b["name"], b["crop"], b["min_quantity"], b["location"], b["contact"]) for b in SAMPLE_BUYERS]
    conn.executemany("""
        INSERT INTO buyers (name, crop, min_quantity, location, contact)
        VALUES (?, ?, ?, ?, ?)
    """, buyer_tuples)
    conn.commit()

    from datetime import timezone
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    alert_tuples = [(a["user_id"], a["crop"], a["threshold_price"], a["alert_type"], now_str) for a in SAMPLE_ALERTS]
    conn.executemany("""
        INSERT INTO price_alerts (user_id, crop, threshold_price, alert_type, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, alert_tuples)
    conn.commit()

    # Build Indices
    create_indexes(conn)

    total_records = conn.execute("SELECT COUNT(*) FROM prices").fetchone()[0]
    duration = round(time.time() - start_total, 2)
    logger.info("================================================================")
    logger.info(f"SUCCESS: Ingestion completed in {duration}s!")
    logger.info(f"  Total Prices Records: {total_records:,}")
    logger.info(f"  Total Unique Mandis:  {mandi_count:,}")
    logger.info(f"  Total Unique Crops:   {crop_count:,}")
    logger.info(f"  Total Buyers:         {len(SAMPLE_BUYERS):,}")
    logger.info(f"  Total Price Alerts:   {len(SAMPLE_ALERTS):,}")
    logger.info("================================================================")

    conn.close()

if __name__ == "__main__":
    seed()
