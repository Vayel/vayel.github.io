import argparse
from collections import defaultdict
import csv
from itertools import tee
import joblib
import json
import math
import os
import sys

from shapely.geometry import shape, Point


SEASONS = ["winter", "spring", "summer", "autumn"]


def check_dest(path):
    if not os.path.isdir(path):
        raise ValueError(f"{path} is not a directory")
    if os.listdir(path):
        raise ValueError(
            f"{path} is not empty, delete its content first"
        )


def dump_json(data, path, **kwargs):
    with open(path, "w") as f:
        json.dump(data, f, separators=(",", ":"), **kwargs)


def is_point_in_karst(point, polygons):
    for polygon in polygons:
        if polygon.contains(point):
            return True
    return False


def parse_sswi_row(row, karst_data):
    try:
        point, lat, lng, _, horizon, season, sswi, _ = row
    except ValueError:
        return
    if point.startswith("#"):
        return

    season = SEASONS[int(season) - 1]
    lat = float(lat)
    lng = float(lng)
    sswi = float(sswi)

    in_karst = is_point_in_karst(Point(lng, lat), karst_data)
    risk_level = 0
    if sswi < -1.4 and in_karst:
        risk_level = 3
    elif sswi < -1.4 and not in_karst:
        risk_level = 2
    elif sswi < -0.7:
        risk_level = 1

    return (horizon, season, {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [lng, lat],
        },
        "properties": {
            "riskLevel": risk_level,
            "sswi": sswi,
        }
    })


def convert(sswi_file, karst_file, dest, n_jobs=-1, batch_size=1000, verbose=50):
    print("Loading data...")
    sswi_file, sswi_file2 = tee(sswi_file)
    sswi_reader = csv.reader(sswi_file, delimiter=";")
    print("Number of points:", sum(1 for line in sswi_file2))

    karst_polygons = []
    for feature in json.load(karst_file)["features"]:
        karst_polygons.append(shape(feature["geometry"]).buffer(0))
    print("Number of karstic polygons:", len(karst_polygons))

    print("Parsing data...")
    points = joblib.Parallel(
        n_jobs=n_jobs,
        verbose=verbose,
        backend="multiprocessing",
        batch_size=batch_size,
    )(
        joblib.delayed(parse_sswi_row)(row, karst_polygons)
        for row in sswi_reader
    )

    min_sswi = math.inf
    max_sswi = -math.inf
    features = defaultdict(  # Horizon
        lambda: defaultdict(list)  # Season
    )
    for point in points:
        if point is None:
            continue
        h, s, p = point
        features[h][s].append(p)
        min_sswi = min(p["properties"]["sswi"], min_sswi)
        max_sswi = max(p["properties"]["sswi"], max_sswi)

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
        os.path.join(dest, f"metadata.json"),
        ensure_ascii=False,
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(epilog=(
        "Example: python sswi_to_json.py ../../assets/water_scarcity/data/sswi.csv "
        "../../assets/water_scarcity/data/karst.json "
        "../../assets/water_scarcity/data/sswi"
    ))
    parser.add_argument(
        "sswi_file",
        help="The path of the csv file containing the sswi",
        type=open
    )
    parser.add_argument(
        "karst_file",
        help="The path of the geojson file containing the karstic data",
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
    convert(args.sswi_file, args.karst_file, args.dest)
