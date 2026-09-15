#!/usr/bin/env python3
"""
Generate realistic AgMarkNet agricultural market price data for testing and seeding.
Covers 10 crops, 16 mandis, 7 states, spanning the last 45 days (450+ records).
"""

import csv
import random
from datetime import datetime, timedelta
from pathlib import Path

# Seed for reproducibility with realistic variation
random.seed(42)

CROPS = [
    {"name": "Wheat", "base_price": 2400, "volatility": 150, "unit": "Quintal"},
    {"name": "Rice (Paddy)", "base_price": 2450, "volatility": 180, "unit": "Quintal"},
    {"name": "Onion", "base_price": 2600, "volatility": 450, "unit": "Quintal"},
    {"name": "Tomato", "base_price": 1900, "volatility": 400, "unit": "Quintal"},
    {"name": "Potato", "base_price": 1550, "volatility": 250, "unit": "Quintal"},
    {"name": "Cotton", "base_price": 7200, "volatility": 350, "unit": "Quintal"},
    {"name": "Soybean", "base_price": 4700, "volatility": 250, "unit": "Quintal"},
    {"name": "Maize", "base_price": 2150, "volatility": 180, "unit": "Quintal"},
    {"name": "Mustard", "base_price": 5600, "volatility": 300, "unit": "Quintal"},
    {"name": "Gram (Chana)", "base_price": 5850, "volatility": 320, "unit": "Quintal"},
]

MANDIS = [
    {"mandi_name": "Lasalgaon APMC", "district": "Nashik", "state": "Maharashtra", "crops": ["Onion", "Tomato", "Wheat", "Soybean"]},
    {"mandi_name": "Vashi APMC", "district": "Thane", "state": "Maharashtra", "crops": ["Wheat", "Rice (Paddy)", "Onion", "Potato", "Tomato"]},
    {"mandi_name": "Pune APMC", "district": "Pune", "state": "Maharashtra", "crops": ["Onion", "Tomato", "Potato", "Soybean", "Gram (Chana)"]},
    {"mandi_name": "Nagpur APMC", "district": "Nagpur", "state": "Maharashtra", "crops": ["Cotton", "Soybean", "Wheat", "Gram (Chana)"]},
    
    {"mandi_name": "Khanna APMC", "district": "Ludhiana", "state": "Punjab", "crops": ["Wheat", "Rice (Paddy)", "Maize", "Mustard"]},
    {"mandi_name": "Amritsar APMC", "district": "Amritsar", "state": "Punjab", "crops": ["Wheat", "Rice (Paddy)", "Potato", "Maize"]},
    {"mandi_name": "Bathinda APMC", "district": "Bathinda", "state": "Punjab", "crops": ["Wheat", "Cotton", "Mustard"]},
    
    {"mandi_name": "Agra Mandi", "district": "Agra", "state": "Uttar Pradesh", "crops": ["Potato", "Mustard", "Wheat", "Onion"]},
    {"mandi_name": "Meerut Mandi", "district": "Meerut", "state": "Uttar Pradesh", "crops": ["Wheat", "Rice (Paddy)", "Potato", "Maize"]},
    {"mandi_name": "Kanpur Mandi", "district": "Kanpur Nagar", "state": "Uttar Pradesh", "crops": ["Wheat", "Rice (Paddy)", "Gram (Chana)", "Mustard"]},
    
    {"mandi_name": "Indore APMC", "district": "Indore", "state": "Madhya Pradesh", "crops": ["Soybean", "Wheat", "Gram (Chana)", "Potato", "Onion"]},
    {"mandi_name": "Neemuch APMC", "district": "Neemuch", "state": "Madhya Pradesh", "crops": ["Soybean", "Mustard", "Wheat", "Gram (Chana)"]},
    
    {"mandi_name": "Kolar APMC", "district": "Kolar", "state": "Karnataka", "crops": ["Tomato", "Potato", "Maize"]},
    {"mandi_name": "Yeshwanthpur APMC", "district": "Bengaluru Urban", "state": "Karnataka", "crops": ["Rice (Paddy)", "Wheat", "Onion", "Potato", "Tomato"]},
    
    {"mandi_name": "Azadpur Mandi", "district": "North Delhi", "state": "Delhi", "crops": ["Wheat", "Rice (Paddy)", "Onion", "Tomato", "Potato", "Mustard"]},
    {"mandi_name": "Rajkot APMC", "district": "Rajkot", "state": "Gujarat", "crops": ["Cotton", "Gram (Chana)", "Soybean", "Mustard"]},
]

def generate_csv(output_path: str, days: int = 45):
    data_dir = Path(output_path).parent
    data_dir.mkdir(parents=True, exist_ok=True)
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Store daily crop base trends to make price movements realistic (not pure random noise)
    crop_trends = {}
    for c in CROPS:
        trend_drift = random.uniform(-0.4, 0.6)  # slight realistic trend over time
        crop_trends[c["name"]] = {
            "drift": trend_drift,
            "base": c["base_price"],
            "vol": c["volatility"],
            "unit": c["unit"]
        }

    records = []
    
    # For each day in the last 45 days
    current_day = start_date
    day_idx = 0
    while current_day <= end_date:
        date_str = current_day.strftime("%Y-%m-%d")
        
        # In Indian Mandis, Sunday trading is often limited, so fewer rows on Sunday
        num_mandi_trades = 6 if current_day.weekday() == 6 else random.randint(10, 14)
        selected_mandis = random.sample(MANDIS, min(num_mandi_trades, len(MANDIS)))
        
        for mandi in selected_mandis:
            # Mandi trades 1-3 crops on a given day
            crops_traded = random.sample(mandi["crops"], min(random.randint(1, 2), len(mandi["crops"])))
            for crop_name in crops_traded:
                trend_info = crop_trends[crop_name]
                # calculate price with trend drift + day-to-day noise + mandi regional variance
                regional_factor = {
                    "Maharashtra": 1.02,
                    "Punjab": 0.98,
                    "Uttar Pradesh": 0.97,
                    "Madhya Pradesh": 0.99,
                    "Karnataka": 1.04,
                    "Delhi": 1.06,
                    "Gujarat": 1.01
                }.get(mandi["state"], 1.0)
                
                day_trend = trend_info["drift"] * day_idx * (trend_info["vol"] * 0.05)
                noise = random.gauss(0, trend_info["vol"] * 0.4)
                price = round((trend_info["base"] + day_trend + noise) * regional_factor, 2)
                price = max(price, trend_info["base"] * 0.5) # avoid negative or unrealistically low
                
                # Quantity traded in Quintals
                quantity = round(random.uniform(50.0, 950.0), 1)
                
                records.append({
                    "date": date_str,
                    "crop_name": crop_name,
                    "mandi_name": mandi["mandi_name"],
                    "state": mandi["state"],
                    "district": mandi["district"],
                    "price_per_unit": price,
                    "quantity": quantity,
                    "unit": trend_info["unit"]
                })
        
        current_day += timedelta(days=1)
        day_idx += 1
        
    # Write to CSV
    fieldnames = ["date", "crop_name", "mandi_name", "state", "district", "price_per_unit", "quantity", "unit"]
    with open(output_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)
        
    print(f"Generated {len(records)} realistic market price records to {output_path}")
    return len(records)

if __name__ == "__main__":
    generate_csv("data/market_prices.csv", days=45)
