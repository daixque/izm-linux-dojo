"""
lessons_data/ を 2 階層走査して、テストパラメータを生成する。
solution_commands が存在するレッスンのみを対象とする。
"""

from pathlib import Path

import yaml

LESSONS_DATA_DIR = Path(__file__).parent.parent / "lessons_data"


def get_lesson_params():
    params = []
    if not LESSONS_DATA_DIR.exists():
        return params

    for chapter_dir in sorted(LESSONS_DATA_DIR.iterdir()):
        if not chapter_dir.is_dir():
            continue
        for lesson_dir in sorted(chapter_dir.iterdir()):
            if not lesson_dir.is_dir():
                continue
            tests_yaml_path = lesson_dir / "tests.ja.yaml"
            if not tests_yaml_path.exists():
                continue
            with open(tests_yaml_path, "r", encoding="utf-8") as f:
                tests_data = yaml.safe_load(f)
            solution_commands = tests_data.get("solution_commands", [])
            if not solution_commands:
                continue
            logical_id = f"{chapter_dir.name}/{lesson_dir.name}"
            params.append({"lesson_id": logical_id})
    return params
