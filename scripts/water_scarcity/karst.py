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


def dump_json(data, path, **kwargs):
    with open(path, "w") as f:
        json.dump(data, f, separators=(",", ":"), **kwargs)


def convert(karst_file, dest):
    print("Loading data...")
    data = json.load(karst_file)

    print("Filtering data...")
    features = []
    for feature in data["features"]:
        if feature["properties"]["TypeZK"] == 1:
            features.append(feature)

    data["features"] = features
    dump_json(data, dest, ensure_ascii=False)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(epilog=(
        "Example: python karst.py ../../assets/water_scarcity/data/karst.json "
        "filtered_karst.json"
    ))
    parser.add_argument(
        "karst_file",
        help="The path of the geojson file containing the karstic data",
        type=open
    )
    parser.add_argument(
        "dest",
        help="The path of the file to write the json into"
    )
    try:
        args = parser.parse_args()
    except (ValueError, FileNotFoundError) as e:
        print(e)
        sys.exit(1)
    convert(args.karst_file, args.dest)
