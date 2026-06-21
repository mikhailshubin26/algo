"""Judge-сервис.

Основной путь: Judge0 CE API (batch submissions).
Fallback: локальный запуск через subprocess, если Judge0 недоступен или
возвращает Internal Error (status 13) — типично для macOS Docker Desktop,
где sandbox isolate не работает из-за ограничений ядра.

Локальный runner поддерживает Python, C, C++.
Go и Java через Judge0 (на Linux) или возвращают RE.
"""

import base64
import os
import re
import subprocess
import tempfile
import time

import requests
from django.conf import settings

from apps.submissions.models import Submission

_ERROR_OUTPUT_LIMIT = 4000

LANGUAGE_IDS = {
    Submission.Language.PYTHON: 71,
    Submission.Language.CPP: 54,
    Submission.Language.C: 50,
    Submission.Language.GO: 60,
    Submission.Language.JAVA: 62,
}

STATUS_MAP = {
    3: Submission.Verdict.AC,
    4: Submission.Verdict.WA,
    5: Submission.Verdict.TLE,
    6: Submission.Verdict.CE,
    7: Submission.Verdict.RE,
    8: Submission.Verdict.RE,
    9: Submission.Verdict.MLE,
    10: Submission.Verdict.RE,
    11: Submission.Verdict.RE,
    12: Submission.Verdict.RE,
    13: Submission.Verdict.RE,
}

_PENDING = {1, 2}
_INTERNAL_ERROR = 13


def _b64(text: str) -> str:
    return base64.b64encode(text.encode()).decode()


def _b64decode(value: str | None) -> str | None:
    if not value:
        return value
    try:
        return base64.b64decode(value).decode(errors="replace")
    except Exception:
        return value


def _normalize_java_source(source: str) -> str:
    """Judge0 (language_id=62) сохраняет код в файл Main.java и запускает
    ``java Main`` — публичный класс обязан называться Main. Студенты обычно
    называют его Solution/Task и т.п., из-за чего получается NZEC (RE), хотя
    решение верное. Переименовываем класс, если он ещё не Main."""
    if re.search(r"\bclass\s+Main\b", source):
        return source
    match = re.search(r"\b(?:public\s+)?class\s+(\w+)", source)
    if not match:
        return source
    name = match.group(1)
    return re.sub(rf"\b{re.escape(name)}\b", "Main", source)


def _judge0_headers() -> dict:
    h = {"Content-Type": "application/json"}
    if settings.JUDGE0_API_KEY:
        h["X-RapidAPI-Key"] = settings.JUDGE0_API_KEY
        h["X-RapidAPI-Host"] = "judge0-ce.p.rapidapi.com"
    return h


# ---------------------------------------------------------------------------
# Judge0 path
# ---------------------------------------------------------------------------

def _run_via_judge0(submission: Submission, test_cases: list) -> list | None:
    """Отправляет все тест-кейсы в Judge0, возвращает список результатов
    или None при сетевой ошибке. Если все результаты — Internal Error,
    тоже возвращает None (чтобы активировать fallback)."""
    language_id = LANGUAGE_IDS.get(submission.language)
    if not language_id:
        return None

    base_url = settings.JUDGE0_API_URL.rstrip("/")
    headers = _judge0_headers()
    params_b64 = {"base64_encoded": "true"}
    problem = submission.problem

    source_code = submission.source_code
    if submission.language == Submission.Language.JAVA:
        source_code = _normalize_java_source(source_code)

    batch = {
        "submissions": [
            {
                "source_code": _b64(source_code),
                "language_id": language_id,
                "stdin": _b64(tc.input_data),
                "expected_output": _b64(tc.expected_output),
                "cpu_time_limit": problem.time_limit_ms / 1000,
                "memory_limit": problem.memory_limit_mb * 1024,
            }
            for tc in test_cases
        ]
    }

    try:
        resp = requests.post(
            f"{base_url}/submissions/batch",
            json=batch,
            headers=headers,
            params=params_b64,
            timeout=10,
        )
        resp.raise_for_status()
    except Exception:
        return None

    tokens = ",".join(item["token"] for item in resp.json())

    results = []
    for _ in range(60):
        time.sleep(1)
        try:
            poll = requests.get(
                f"{base_url}/submissions/batch",
                headers=headers,
                params={**params_b64, "tokens": tokens},
                timeout=10,
            )
            poll.raise_for_status()
        except Exception:
            return None
        results = poll.json()["submissions"]
        if all(r["status"]["id"] not in _PENDING for r in results):
            break

    if all(r["status"]["id"] == _INTERNAL_ERROR for r in results):
        return None

    for r in results:
        for key in ("stdout", "stderr", "compile_output", "message"):
            r[key] = _b64decode(r.get(key))

    return results


# ---------------------------------------------------------------------------
# Local subprocess fallback
# ---------------------------------------------------------------------------

_EXT = {
    Submission.Language.PYTHON: ".py",
    Submission.Language.CPP: ".cpp",
    Submission.Language.C: ".c",
}


def _run_one_local(source: str, language: str, stdin: str, time_limit_ms: int) -> dict:
    """Запускает код локально, возвращает словарь совместимый с Judge0."""
    ext = _EXT.get(language)
    if ext is None:
        return {"status": {"id": _INTERNAL_ERROR}, "stdout": None, "time": None, "memory": None}

    timeout_sec = time_limit_ms / 1000

    with tempfile.TemporaryDirectory() as tmpdir:
        src = os.path.join(tmpdir, f"solution{ext}")
        exe = os.path.join(tmpdir, "solution")

        with open(src, "w") as f:
            f.write(source)

        # Компиляция (C / C++)
        if language in (Submission.Language.C, Submission.Language.CPP):
            compiler = "gcc" if language == Submission.Language.C else "g++"
            compile_result = subprocess.run(
                [compiler, "-O2", "-o", exe, src],
                capture_output=True, text=True, timeout=30,
            )
            if compile_result.returncode != 0:
                return {
                    "status": {"id": 6},  # CE
                    "stdout": None,
                    "stderr": compile_result.stderr,
                    "time": None,
                    "memory": None,
                }
            cmd = [exe]
        else:
            cmd = ["python3", src]

        # Запуск
        try:
            run_result = subprocess.run(
                cmd,
                input=stdin,
                capture_output=True,
                text=True,
                timeout=timeout_sec,
            )
        except subprocess.TimeoutExpired:
            return {"status": {"id": 5}, "stdout": None, "time": str(timeout_sec), "memory": None}  # TLE

        stdout = run_result.stdout
        if run_result.returncode != 0:
            return {"status": {"id": 7}, "stdout": stdout, "stderr": run_result.stderr, "time": None, "memory": None}  # RE

        return {"status": {"id": 3, "stdout_ok": True}, "stdout": stdout, "time": None, "memory": None}


def _run_via_local(submission: Submission, test_cases: list) -> list:
    results = []
    for tc in test_cases:
        result = _run_one_local(
            submission.source_code,
            submission.language,
            tc.input_data,
            submission.problem.time_limit_ms,
        )
        # Сравниваем вывод с ожидаемым
        if result["status"]["id"] == 3:
            actual = (result.get("stdout") or "").rstrip("\n")
            expected = tc.expected_output.rstrip("\n")
            if actual != expected:
                result["status"]["id"] = 4  # WA
        results.append(result)
    return results


# ---------------------------------------------------------------------------
# Агрегация результатов
# ---------------------------------------------------------------------------

def _aggregate(submission: Submission, results: list, total: int) -> Submission:
    tests_passed = 0
    worst_verdict = Submission.Verdict.AC
    max_time_ms = 0
    max_memory_kb = 0
    error_output = ""

    for r in results:
        status_id = r["status"]["id"]
        if status_id == 3:
            tests_passed += 1
        elif worst_verdict == Submission.Verdict.AC:
            worst_verdict = STATUS_MAP.get(status_id, Submission.Verdict.RE)
            error_output = (r.get("compile_output") or r.get("stderr") or r.get("message") or "")[:_ERROR_OUTPUT_LIMIT]

        if r.get("time"):
            max_time_ms = max(max_time_ms, int(float(r["time"]) * 1000))
        if r.get("memory"):
            max_memory_kb = max(max_memory_kb, int(r["memory"]))

    submission.tests_passed = tests_passed
    submission.is_accepted = tests_passed == total
    submission.verdict = Submission.Verdict.AC if submission.is_accepted else worst_verdict
    submission.exec_time_ms = max_time_ms or None
    submission.memory_kb = max_memory_kb or None
    submission.error_output = error_output
    submission.save(
        update_fields=["tests_passed", "is_accepted", "verdict", "exec_time_ms", "memory_kb", "error_output"]
    )
    return submission


# ---------------------------------------------------------------------------
# Точка входа
# ---------------------------------------------------------------------------

def run_submission(submission: Submission) -> Submission:
    problem = submission.problem
    test_cases = list(problem.test_cases.order_by("order"))

    if not test_cases:
        submission.tests_passed = 0
        submission.is_accepted = False
        submission.verdict = Submission.Verdict.WA
        submission.save(update_fields=["tests_passed", "is_accepted", "verdict"])
        return submission

    results = _run_via_judge0(submission, test_cases)

    if results is None:
        results = _run_via_local(submission, test_cases)

    return _aggregate(submission, results, len(test_cases))
