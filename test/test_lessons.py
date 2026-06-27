"""
全レッスンの模範解答コマンドが、ブラウザ内テストをすべてパスすることを確認する。
"""

import pytest

from helpers import (
    click_test_button,
    compute_timeout,
    format_failures,
    get_failed_tests,
    get_solution_commands,
    inject_solution,
    wait_for_ready,
)
from lesson_params import get_lesson_params

_LESSONS = get_lesson_params()


@pytest.mark.parametrize("lesson", _LESSONS, ids=lambda p: p["lesson_id"])
def test_solution_passes_all_tests(page, base_url, lesson):
    lesson_id = lesson["lesson_id"]
    timeout_ms = compute_timeout(lesson)

    page.set_default_navigation_timeout(timeout_ms)
    page.goto(f"{base_url}/lessons/{lesson_id}/exercise.ja.html")

    wait_for_ready(page, timeout_ms)

    solution_commands = get_solution_commands(page)
    inject_solution(page, solution_commands)

    click_test_button(page)

    failures = get_failed_tests(page)
    assert not failures, format_failures(lesson_id, failures)
