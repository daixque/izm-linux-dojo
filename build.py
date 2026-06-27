#!/usr/bin/env python3
"""
build.py - レッスンコンテンツのビルドスクリプト

YAMLファイルとJinja2テンプレートからHTMLファイルを生成します。

使用方法:
    python build.py                              # 全レッスンをビルド
    python build.py 01_dir_and_file/01_ls_cd     # 特定のレッスンのみビルド
    python build.py 01_dir_and_file              # 特定の章の全レッスンをビルド
    python build.py --clean                      # クリーンビルド
"""

import json
import re
import shutil
import sys
from pathlib import Path

import yaml
from jinja2 import Environment, FileSystemLoader, TemplateError


class ValidationError(Exception):
    """バリデーションエラー"""
    pass


def get_nested_value(data, key_path):
    keys = key_path.split('.')
    value = data
    for key in keys:
        if isinstance(value, dict) and key in value:
            value = value[key]
        else:
            return None
    return value


def load_ui_strings(lang):
    ui_file = Path(f"ui_strings/{lang}.yaml")
    if not ui_file.exists():
        raise FileNotFoundError(f"UI strings file not found: {ui_file}")
    with open(ui_file, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)


def load_yaml_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    except yaml.YAMLError as e:
        print(f"❌ YAMLパースエラー: {filepath}")
        print(f"   {e}")
        sys.exit(1)
    except FileNotFoundError:
        print(f"❌ ファイルが見つかりません: {filepath}")
        sys.exit(1)


def validate_learn_yaml(data, filename):
    required_fields = ['lesson.number', 'lesson.id', 'lesson.title', 'content']
    errors = [f"Missing required field: {f}" for f in required_fields if not get_nested_value(data, f)]
    if errors:
        raise ValidationError(f"{filename}: " + ", ".join(errors))


def validate_exercise_yaml(data, filename):
    required_fields = [
        'lesson.number', 'lesson.id', 'lesson.title',
        'task_description', 'instructions', 'hints'
    ]
    errors = [f"Missing required field: {f}" for f in required_fields if not get_nested_value(data, f)]
    if errors:
        raise ValidationError(f"{filename}: " + ", ".join(errors))


def validate_tests_yaml(data, filename):
    required_fields = ['initial_filesystem', 'initial_cwd', 'tests']
    errors = [f"Missing required field: {f}" for f in required_fields if f not in data]
    if 'tests' in data:
        for i, test in enumerate(data['tests']):
            if 'name' not in test:
                errors.append(f"Test {i}: Missing name")
            if 'type' not in test:
                errors.append(f"Test {i}: Missing type")
    if errors:
        raise ValidationError(f"{filename}: " + ", ".join(errors))


def discover_lessons(chapter_filter=None, lesson_filter=None):
    """
    lessons_data/{chapter}/{lesson}/ を列挙する。

    Returns:
        list of dict: chapter_id, lesson_id, path, logical_id
    """
    lessons_data_dir = Path("lessons_data")
    if not lessons_data_dir.exists():
        return []

    lessons = []
    for chapter_dir in sorted(lessons_data_dir.iterdir()):
        if not chapter_dir.is_dir():
            continue
        chapter_id = chapter_dir.name
        if chapter_filter and chapter_id != chapter_filter:
            continue

        for lesson_dir in sorted(chapter_dir.iterdir()):
            if not lesson_dir.is_dir():
                continue
            lesson_id = lesson_dir.name
            if lesson_filter and lesson_id != lesson_filter:
                continue

            lessons.append({
                'chapter_id': chapter_id,
                'lesson_id': lesson_id,
                'path': lesson_dir,
                'logical_id': f"{chapter_id}/{lesson_id}",
            })
    return lessons


def parse_target_arg(arg):
    """01_dir_and_file/01_ls_cd または 01_dir_and_file を解析"""
    parts = arg.strip('/').split('/')
    if len(parts) == 2:
        return parts[0], parts[1]
    if len(parts) == 1:
        return parts[0], None
    return None, None


def relative_lesson_href(from_chapter, from_lesson, to_chapter, to_lesson):
    if from_chapter == to_chapter:
        return f"../{to_lesson}/"
    return f"../../{to_chapter}/{to_lesson}/"


def build_next_lesson_map(all_lessons, languages):
    """logical_id -> {lang: {href, title}}"""
    next_map = {}
    for lang in languages:
        lang_lessons = []
        for lesson in all_lessons:
            learn_file = lesson['path'] / f"learn.{lang}.yaml"
            if learn_file.exists():
                lang_lessons.append(lesson)

        for i, current in enumerate(lang_lessons):
            if i + 1 >= len(lang_lessons):
                continue
            nxt = lang_lessons[i + 1]
            learn_file = nxt['path'] / f"learn.{lang}.yaml"
            try:
                with open(learn_file, 'r', encoding='utf-8') as f:
                    title = yaml.safe_load(f).get('lesson', {}).get('title', nxt['logical_id'])
            except Exception:
                title = nxt['logical_id']

            href = relative_lesson_href(
                current['chapter_id'], current['lesson_id'],
                nxt['chapter_id'], nxt['lesson_id']
            )
            logical_id = current['logical_id']
            if logical_id not in next_map:
                next_map[logical_id] = {}
            next_map[logical_id][lang] = {'href': href, 'title': title}
    return next_map


def build_lesson(lesson_info, env, languages=None, next_lesson_map=None):
    if languages is None:
        languages = ['ja', 'en']

    chapter_id = lesson_info['chapter_id']
    lesson_id = lesson_info['lesson_id']
    lesson_dir = lesson_info['path']
    logical_id = lesson_info['logical_id']

    print(f"\n📦 Building lesson: {logical_id}")

    for lang in languages:
        print(f"  🌐 Building {lang}...")
        next_lesson = next_lesson_map.get(logical_id, {}).get(lang) if next_lesson_map else None

        tests_yaml_path = lesson_dir / f"tests.{lang}.yaml"
        if not tests_yaml_path.exists():
            print(f"  ⚠️  Skipping {lang}: tests.{lang}.yaml not found")
            continue

        tests_data = load_yaml_file(tests_yaml_path)
        try:
            validate_tests_yaml(tests_data, str(tests_yaml_path))
        except ValidationError as e:
            print(f"  ❌ Validation error in tests.{lang}.yaml: {e}")
            continue

        try:
            ui_strings = load_ui_strings(lang)
        except FileNotFoundError as e:
            print(f"  ⚠️  Skipping {lang}: {e}")
            continue

        output_dir = Path(f"docs/lessons/{chapter_id}/{lesson_id}")
        output_dir.mkdir(parents=True, exist_ok=True)

        learn_yaml_path = lesson_dir / f"learn.{lang}.yaml"
        if learn_yaml_path.exists():
            learn_data = load_yaml_file(learn_yaml_path)
            try:
                validate_learn_yaml(learn_data, str(learn_yaml_path))
                template = env.get_template('learn_template.html')
                html = template.render(
                    lang=lang,
                    ui=ui_strings,
                    lesson=learn_data['lesson'],
                    content=learn_data['content'],
                )
                output_file = output_dir / f"learn.{lang}.html"
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(html)
                print(f"    ✅ {output_file}")
            except (ValidationError, TemplateError) as e:
                print(f"    ❌ Learn error: {e}")

        exercise_yaml_path = lesson_dir / f"exercise.{lang}.yaml"
        if exercise_yaml_path.exists():
            exercise_data = load_yaml_file(exercise_yaml_path)
            try:
                validate_exercise_yaml(exercise_data, str(exercise_yaml_path))
                template = env.get_template('exercise_template.html')
                html = template.render(
                    lang=lang,
                    ui=ui_strings,
                    lesson=exercise_data['lesson'],
                    task_description=exercise_data['task_description'],
                    instructions=exercise_data['instructions'],
                    hints=exercise_data['hints'],
                    initial_filesystem=tests_data['initial_filesystem'],
                    initial_cwd=tests_data['initial_cwd'],
                    tests=tests_data['tests'],
                    solution_commands=tests_data.get('solution_commands', []),
                    next_lesson=next_lesson,
                )
                output_file = output_dir / f"exercise.{lang}.html"
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(html)
                print(f"    ✅ {output_file}")
            except (ValidationError, TemplateError) as e:
                print(f"    ❌ Exercise error: {e}")


def load_chapters_data(lang):
    chapters_file = Path(f"chapters_data/chapters.{lang}.yaml")
    if not chapters_file.exists():
        print(f"⚠️  Chapters file not found: {chapters_file}")
        return []
    with open(chapters_file, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f).get('chapters', [])


def generate_metadata(lang):
    print(f"\n📋 Generating metadata for {lang}...")
    chapters_data = load_chapters_data(lang)
    if not chapters_data:
        return None

    chapters_dict = {ch['number']: ch for ch in chapters_data}
    chapters_lessons = {ch['number']: [] for ch in chapters_data}

    for lesson_info in discover_lessons():
        logical_id = lesson_info['logical_id']
        chapter_id = lesson_info['chapter_id']
        lesson_dir = lesson_info['path']

        learn_file = lesson_dir / f"learn.{lang}.yaml"
        if not learn_file.exists():
            print(f"  ⚠️  Skipping {logical_id}: learn.{lang}.yaml not found")
            continue

        try:
            with open(learn_file, 'r', encoding='utf-8') as f:
                learn_data = yaml.safe_load(f)

            lesson_meta = learn_data.get('lesson', {})
            lesson_number = lesson_meta.get('number', '')
            lesson_title = lesson_meta.get('title', '')
            chapter_number = lesson_meta.get('chapter_number', '')
            if not chapter_number:
                match = re.match(r'^(\d+)', chapter_id)
                chapter_number = match.group(1).zfill(2) if match else ''

            exercise_file = lesson_dir / f"exercise.{lang}.yaml"
            description = ''
            if exercise_file.exists():
                with open(exercise_file, 'r', encoding='utf-8') as f:
                    exercise_data = yaml.safe_load(f)
                if 'description' in exercise_data:
                    description = exercise_data['description'].strip()
                else:
                    task_desc = exercise_data.get('task_description', '')
                    first_p = re.search(r'<p>(.*?)</p>', task_desc, re.DOTALL)
                    if first_p:
                        description = re.sub(r'<[^>]+>', '', first_p.group(1)).strip()
                    else:
                        description = re.sub(r'<[^>]+>', '', task_desc).strip()

            html_learn = Path(f"docs/lessons/{logical_id}/learn.{lang}.html")
            html_exercise = Path(f"docs/lessons/{logical_id}/exercise.{lang}.html")
            available = html_learn.exists() and html_exercise.exists()

            display_number = f"{chapter_number}-{lesson_number}" if chapter_number and lesson_number else logical_id

            if chapter_number in chapters_lessons:
                chapters_lessons[chapter_number].append({
                    'id': logical_id,
                    'number': display_number,
                    'title': lesson_title,
                    'description': description,
                    'available': available,
                })
                print(f"  ✓ Added {logical_id} to Chapter {chapter_number}")
            else:
                print(f"  ⚠️  Chapter {chapter_number} not found for lesson {logical_id}")
        except Exception as e:
            print(f"  ⚠️  Error processing {logical_id}: {e}")

    metadata = {'chapters': []}
    for chapter_data in chapters_data:
        chapter_number = chapter_data['number']
        chapter_lessons = sorted(
            chapters_lessons.get(chapter_number, []),
            key=lambda x: x['number']
        )
        metadata['chapters'].append({
            'id': chapter_data['id'],
            'number': int(chapter_number),
            'title': chapter_data['title'],
            'description': chapter_data['description'],
            'lessons': chapter_lessons,
        })
    return metadata


def build_metadata():
    print("\n" + "=" * 60)
    print("📋 Building metadata files...")
    print("=" * 60)

    for lang in ['ja', 'en']:
        metadata = generate_metadata(lang)
        if metadata:
            output_dir = Path("docs/lessons")
            output_dir.mkdir(parents=True, exist_ok=True)
            output_file = output_dir / f"metadata.{lang}.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)
            print(f"  ✅ Generated {output_file}")
        else:
            print(f"  ❌ Failed to generate metadata for {lang}")
    print("=" * 60)


def main():
    clean = '--clean' in sys.argv
    specific_targets = [arg for arg in sys.argv[1:] if not arg.startswith('--')]

    if clean:
        print("🧹 Clean build: removing docs/lessons/...")
        lessons_dir = Path("docs/lessons")
        if lessons_dir.exists():
            shutil.rmtree(lessons_dir)
        lessons_dir.mkdir(parents=True, exist_ok=True)

    env = Environment(
        loader=FileSystemLoader('templates'),
        autoescape=True,
        trim_blocks=True,
        lstrip_blocks=True,
    )

    if not Path("lessons_data").exists():
        print("❌ lessons_data/ directory not found")
        sys.exit(1)

    all_lessons = discover_lessons()
    if not all_lessons:
        print("⚠️  No lessons found in lessons_data/")

    chapter_filter = None
    lesson_filter = None
    if specific_targets:
        target = specific_targets[0]
        chapter_filter, lesson_filter = parse_target_arg(target)
        lesson_dirs = discover_lessons(chapter_filter, lesson_filter)
        if not lesson_dirs:
            print(f"⚠️  No matching lessons for: {target}")
    else:
        lesson_dirs = all_lessons

    next_lesson_map = build_next_lesson_map(all_lessons, ['ja', 'en'])

    total = 0
    for lesson_info in lesson_dirs:
        build_lesson(lesson_info, env, next_lesson_map=next_lesson_map)
        total += 1

    print(f"\n✨ Build complete! ({total} lessons processed)")
    build_metadata()


if __name__ == "__main__":
    main()
