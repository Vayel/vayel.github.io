import argparse
from collections import defaultdict
import csv
import json
import os
import shutil
import sys


QUESTIONS_DIRNAME = "questions"


def check_dest(path, overwrite):
    if not os.path.isdir(path):
        raise ValueError(f"{path} is not a directory")
    if not overwrite and os.listdir(path):
        raise ValueError(
            f"{path} is not empty. Delete its content or set --overwrite flag"
        )
    shutil.rmtree(path)
    os.makedirs(os.path.join(path, QUESTIONS_DIRNAME))


def dump_json(data, path):
    with open(path, "w") as f:
        json.dump(data, f, separators=(",", ":"), ensure_ascii=False)


def migrate(csvfile, dest):
    categories = defaultdict(list)
    levels = defaultdict(list)
    keywords = defaultdict(list)
    reader = csv.reader(csvfile)

    for row in reader:
        question = json.loads(row[0])
        id_ = question["id"]

        for cat in question["categories"]:
            categories[cat].append(id_)

        for keyword in question["keywords"]:
            keywords[keyword].append(id_)

        levels[question["level"]].append(id_)

        dump_json(question, os.path.join(dest, QUESTIONS_DIRNAME, f"{id_}.json"))

    dump_json(categories, os.path.join(dest, "categories.json"))
    dump_json(keywords, os.path.join(dest, "keywords.json"))
    dump_json(levels, os.path.join(dest, "levels.json"))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(epilog=(
        "Example: python migrate_questions.py questions.csv ../data"
    ))
    parser.add_argument(
        "csvfile",
        help="The path of the csv file containing the questions",
        type=open
    )
    parser.add_argument(
        "dest",
        help="The path of the directory to migrate the questions to"
    )
    parser.add_argument(
        "--overwrite",
        help="Clear destination's contents before migrating",
        action="store_true"
    )

    try:
        args = parser.parse_args()
        check_dest(args.dest, args.overwrite)
    except (ValueError, FileNotFoundError) as e:
        print(e)
        sys.exit(1)

    migrate(args.csvfile, args.dest)
