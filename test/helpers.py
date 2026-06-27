"""Playwright ページ操作のユーティリティ（Linux Dojo ターミナル版）"""


def compute_timeout(_lesson: dict) -> int:
    return 15_000


def wait_for_ready(page, timeout_ms: int) -> None:
    """ターミナル初期化完了（#btn-test が有効）まで待機する。"""
    page.wait_for_function(
        "() => !document.getElementById('btn-test')?.disabled",
        timeout=timeout_ms,
    )


def get_solution_commands(page) -> list:
    return page.evaluate("() => SOLUTION_COMMANDS")


def run_solution_commands(page, commands: list) -> None:
    """模範コマンドをターミナルで順に実行する。"""
    page.evaluate(
        """(commands) => {
            if (window.terminalUI) {
                window.terminalUI.runCommands(commands);
            }
        }""",
        commands,
    )


def inject_solution(page, solution_commands: list) -> None:
    run_solution_commands(page, solution_commands)


def get_solution_code(page) -> list:
    return get_solution_commands(page)


def click_test_button(page) -> None:
    page.click("#btn-test")
    page.wait_for_selector(
        "#test-results-overlay",
        state="visible",
        timeout=30_000,
    )


def get_failed_tests(page) -> list[dict]:
    failed_elements = page.query_selector_all(".test-item.test-failed")
    results = []
    for el in failed_elements:
        name_el = el.query_selector(".test-name")
        message_el = el.query_selector(".test-message")
        results.append(
            {
                "name": name_el.inner_text() if name_el else "(unknown)",
                "message": message_el.inner_text() if message_el else "",
            }
        )
    return results


def format_failures(lesson_id: str, failures: list[dict]) -> str:
    lines = [f"[{lesson_id}] {len(failures)} test(s) failed:"]
    for f in failures:
        lines.append(f"  ✗ {f['name']}")
        if f["message"]:
            lines.append(f"    {f['message']}")
    return "\n".join(lines)
