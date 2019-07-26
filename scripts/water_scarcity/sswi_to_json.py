import argparse
from collections import defaultdict
import csv
import json
import math
import os
import sys


SEASONS = ["winter", "spring", "summer", "autumn"]


def check_dest(path):
    if not os.path.isdir(path):
        raise ValueError(f"{path} is not a directory")
    if os.listdir(path):
        raise ValueError(
            f"{path} is not empty, delete its content first"
        )


def dump_json(data, path):
    with open(path, "w") as f:
        json.dump(data, f, separators=(",", ":"))


def convert(csvfile, dest):
    features = defaultdict(  # Horizon
        lambda: defaultdict(list)  # Season
    )
    reader = csv.reader(csvfile, delimiter=";")
    min_sswi = math.inf
    max_sswi = -math.inf

    for row in reader:
        try:
            point, lat, lng, _, horizon, season, sswi, _ = row
        except ValueError:
            continue
        if point.startswith("#"):
            continue

        season = SEASONS[int(season) - 1]
        lat = float(lat)
        lng = float(lng)
        sswi = float(sswi)
        min_sswi = min(sswi, min_sswi)
        max_sswi = max(sswi, max_sswi)

        risk_level = 0
        if sswi < -1.4:  # TODO: karstic area?
            risk_level = 2
        elif sswi < -0.7:
            risk_level = 1

        features[horizon][season].append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lng, lat],
            },
            "properties": {
                "riskLevel": risk_level,
            }
        })

    for horizon, horizon_data in features.items():
        for season, points in horizon_data.items():
            dump_json(
                {
                    "type": "FeatureCollection",
                    "features": points,
                },
                os.path.join(dest, f"{horizon}_{season}.json")
            )
    dump_json(
        {
            "sswi": dict(min=min_sswi, max=max_sswi),
            "riskLevels": [
                "",
                "Limitations de tous les prélèvements d'eau (-1.4 < sswi < -0.7)",
                "Interdiction d'utiliser l'eau pour des usages non prioritaires (sswi < -1.4 + zone non karstique)",
                "Menaces de pénuries en eau potable (sswi < -1.4 + zone karstique)"
            ],
        },
        os.path.join(dest, f"metadata.json")
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(epilog=(
        "Example: python sswi_to_json.py ../../assets/water_scarcity/sswi.csv ../../assets/water_scarcity/data/sswi"
    ))
    parser.add_argument(
        "csvfile",
        help="The path of the csv file containing the questions",
        type=open
    )
    parser.add_argument(
        "dest",
        help="The path of the directory to save the json into"
    )
    try:
        args = parser.parse_args()
        check_dest(args.dest)
    except (ValueError, FileNotFoundError) as e:
        print(e)
        sys.exit(1)
    convert(args.csvfile, args.dest)
