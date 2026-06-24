"""
tests/test_import_draft.py — import-draft.py 解析器單元測試

覆蓋範圍：
  - _extract_table_rows / parse_appendix_table：Markdown 表格解析
  - is_v2_format：格式偵測
  - parse_date：日期正規化
  - infer_team：Team 關鍵字推斷
  - STATUS_MAP / parse_actions：狀態正規化（P0 bug 修復驗證）
  - MILESTONE_STATUS_MAP / parse_milestones：里程碑狀態正規化
  - find_existing：模糊比對
  - parse_projects：[keep] 標記 + 進度解析
"""
import sys
import os

# 讓 import 能找到 scripts/import-draft.py（連字號 → importlib）
import importlib.util
_script = os.path.join(os.path.dirname(__file__), "..", "scripts", "import-draft.py")
_spec   = importlib.util.spec_from_file_location("import_draft", os.path.abspath(_script))
_mod    = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)

# 把目標函式引入本地命名空間
_extract_table_rows    = _mod._extract_table_rows
parse_appendix_table   = _mod.parse_appendix_table
is_v2_format           = _mod.is_v2_format
parse_date             = _mod.parse_date
infer_team             = _mod.infer_team
find_existing          = _mod.find_existing
parse_actions          = _mod.parse_actions
parse_milestones       = _mod.parse_milestones
parse_projects         = _mod.parse_projects
STATUS_MAP             = _mod.STATUS_MAP
MILESTONE_STATUS_MAP   = _mod.MILESTONE_STATUS_MAP


# ── 測試工具 ──────────────────────────────────────────────────────────────────

MINIMAL_V2 = """\
## Appendix: Dashboard Export

### 專案進度
| 專案名稱 | 狀態 | 進度 % | 本週更新 | 備註 |
| --- | --- | --- | --- | --- |
| AIWize | on-track | 60 | 完成 MVP | - |

### Action Items
| # | 任務描述 | 負責人 | 目標日期 | 狀態 | 分類 |
| --- | --- | --- | --- | --- | --- |
| 1 | 部署測試環境 | Alice | 2026-06-15 | pending | infra |

### Risks
| Risk ID | 風險描述 | 嚴重度 | 負責人 | 因應措施 |
| --- | --- | --- | --- | --- |
| R01 | 第三方 API 不穩定 | high | Bob | 加 retry |

### 里程碑
| 日期 | 里程碑事項 | 團隊 | 狀態 |
| --- | --- | --- | --- |
| 2026-06-20 | Beta 上線 | media-agent | upcoming |
"""


# ── _extract_table_rows ───────────────────────────────────────────────────────

class TestExtractTableRows:
    def test_basic(self):
        block = """\
| 名稱 | 狀態 |
| --- | --- |
| AIWize | on-track |
| TVBS | at-risk |
"""
        rows = _extract_table_rows(block)
        assert len(rows) == 2
        assert rows[0]["名稱"] == "AIWize"
        assert rows[1]["狀態"] == "at-risk"

    def test_empty_block(self):
        assert _extract_table_rows("") == []

    def test_no_table(self):
        assert _extract_table_rows("只是普通文字") == []

    def test_missing_cells_padded(self):
        block = """\
| A | B | C |
| --- | --- | --- |
| 1 | 2 |
"""
        rows = _extract_table_rows(block)
        assert rows[0]["C"] == ""

    def test_extra_separator_skipped(self):
        block = """\
| 名稱 | 狀態 |
| ---- | ---- |
| AIWize | on-track |
| ---- | ----- |
| TVBS | at-risk |
"""
        rows = _extract_table_rows(block)
        assert len(rows) == 2


# ── parse_appendix_table ──────────────────────────────────────────────────────

class TestParseAppendixTable:
    def test_all_four_sections_parsed(self):
        assert len(parse_appendix_table(MINIMAL_V2, "專案進度"))   == 1
        assert len(parse_appendix_table(MINIMAL_V2, "Action Items")) == 1
        assert len(parse_appendix_table(MINIMAL_V2, "Risks"))       == 1
        assert len(parse_appendix_table(MINIMAL_V2, "里程碑"))      == 1

    def test_missing_appendix_returns_empty(self):
        text = "# 普通週報\n\n沒有 Appendix 區塊"
        assert parse_appendix_table(text, "Action Items") == []

    def test_missing_subsection_returns_empty(self):
        text = "## Appendix: Dashboard Export\n### 專案進度\n| 名稱 |\n| --- |\n| A |\n"
        assert parse_appendix_table(text, "里程碑") == []

    def test_correct_row_content(self):
        rows = parse_appendix_table(MINIMAL_V2, "Action Items")
        assert rows[0]["任務描述"] == "部署測試環境"
        assert rows[0]["負責人"]   == "Alice"
        assert rows[0]["狀態"]     == "pending"


# ── is_v2_format ──────────────────────────────────────────────────────────────

class TestIsV2Format:
    def test_v2_detected(self):
        assert is_v2_format(MINIMAL_V2) is True

    def test_old_format_not_detected(self):
        assert is_v2_format("## 專案進度\n| 名稱 |") is False

    def test_empty_text(self):
        assert is_v2_format("") is False


# ── parse_date ────────────────────────────────────────────────────────────────

class TestParseDate:
    def test_slash_format(self):
        assert parse_date("2026/06/15") == "2026-06-15"

    def test_dash_format(self):
        assert parse_date("2026-06-15") == "2026-06-15"

    def test_single_digit_month_day(self):
        assert parse_date("2026/6/5") == "2026-06-05"

    def test_tbd(self):
        assert parse_date("TBD") == ""

    def test_empty(self):
        assert parse_date("") == ""

    def test_dash_only(self):
        assert parse_date("-") == ""

    def test_quarter_returns_empty(self):
        assert parse_date("Q3 2026") == ""

    def test_month_chinese(self):
        assert parse_date("9月發布") == ""

    def test_whitespace_stripped(self):
        assert parse_date("  2026-07-01  ") == "2026-07-01"


# ── infer_team ────────────────────────────────────────────────────────────────

class TestInferTeam:
    def test_tv_solution_keyword(self):
        assert infer_team("TVBS 整合測試") == "tv-solution"

    def test_media_agent_keyword(self):
        assert infer_team("STT 語音辨識優化") == "media-agent"

    def test_chuangzaoli_keyword(self):
        assert infer_team("小栗方官網改版") == "chuangzaoli"

    def test_learnmode_keyword(self):
        assert infer_team("LearnMode 課程管理") == "learnmode"

    def test_default_fallback(self):
        assert infer_team("完全不相干的任務") == "media-agent"


# ── STATUS_MAP / parse_actions 狀態正規化 ─────────────────────────────────────

class TestStatusMap:
    """驗證 P0 修復：STATUS_MAP fallback 為 'pending' 而非 'not-started'。"""

    def test_known_statuses_map_correctly(self):
        assert STATUS_MAP["pending"]      == "pending"
        assert STATUS_MAP["not-started"]  == "pending"
        assert STATUS_MAP["in-progress"]  == "in-progress"
        assert STATUS_MAP["in progress"]  == "in-progress"
        assert STATUS_MAP["done"]         == "done"
        assert STATUS_MAP["completed"]    == "done"
        assert STATUS_MAP["blocked"]      == "blocked"

    def test_unknown_status_falls_back_to_pending(self):
        # get() fallback 必須是 "pending"（P0 修復核心）
        assert STATUS_MAP.get("not-started", "pending") == "pending"
        assert STATUS_MAP.get("waiting",     "pending") == "pending"
        assert STATUS_MAP.get("overdue",     "pending") == "pending"
        assert STATUS_MAP.get("random-val",  "pending") == "pending"

    def test_fallback_is_not_not_started(self):
        """確保 fallback 不再是舊的非法值。"""
        assert STATUS_MAP.get("anything",    "pending") != "not-started"


class TestParseActionsStatusNorm:
    """parse_actions() 端對端狀態正規化。"""

    def _make_md(self, status_str):
        return f"""\
## Appendix: Dashboard Export

### 專案進度
| 專案名稱 | 狀態 | 進度 % | 本週更新 | 備註 |
| --- | --- | --- | --- | --- |

### Action Items
| # | 任務描述 | 負責人 | 目標日期 | 狀態 | 分類 |
| --- | --- | --- | --- | --- | --- |
| 1 | 測試任務 | Alice | 2026-06-20 | {status_str} | dev |

### Risks
| Risk ID | 風險描述 | 嚴重度 | 負責人 | 因應措施 |
| --- | --- | --- | --- | --- |

### 里程碑
| 日期 | 里程碑事項 | 團隊 | 狀態 |
| --- | --- | --- | --- |
"""

    def _parse(self, status_str):
        text = self._make_md(status_str)
        actions = parse_actions(text, "W25", "2026-06-15", [], [], v2=True)
        return actions[0]["status"] if actions else None

    def test_pending_stays_pending(self):
        assert self._parse("pending") == "pending"

    def test_not_started_becomes_pending(self):
        assert self._parse("not-started") == "pending"

    def test_in_progress_normalized(self):
        assert self._parse("in progress") == "in-progress"

    def test_completed_becomes_done(self):
        assert self._parse("completed") == "done"

    def test_blocked_stays_blocked(self):
        assert self._parse("blocked") == "blocked"

    def test_unknown_status_becomes_pending(self):
        assert self._parse("overdue")  == "pending"
        assert self._parse("waiting")  == "pending"
        assert self._parse("未開始")   == "pending"

    def test_status_preservation_existing_item(self):
        """有既有記錄且 MD 非 done 時，保留既有狀態。"""
        existing = [{"id": "action-w25-01", "task": "測試任務", "status": "in-progress", "_createdAt": "2026-01-01T00:00:00.000Z"}]
        text = self._make_md("pending")
        actions = parse_actions(text, "W25", "2026-06-15", existing, [], v2=True)
        assert actions[0]["status"] == "in-progress"

    def test_done_in_md_overrides_existing_status(self):
        """MD 標 done 時，即使既有紀錄非 done，也更新為 done。"""
        existing = [{"id": "action-w25-01", "task": "測試任務", "status": "in-progress", "_createdAt": "2026-01-01T00:00:00.000Z"}]
        text = self._make_md("done")
        actions = parse_actions(text, "W25", "2026-06-15", existing, [], v2=True)
        assert actions[0]["status"] == "done"


# ── MILESTONE_STATUS_MAP / parse_milestones ───────────────────────────────────

class TestMilestoneStatusMap:
    def test_known_statuses(self):
        assert MILESTONE_STATUS_MAP["done"]        == "done"
        assert MILESTONE_STATUS_MAP["completed"]   == "done"
        assert MILESTONE_STATUS_MAP["upcoming"]    == "upcoming"
        assert MILESTONE_STATUS_MAP["in-progress"] == "in-progress"
        assert MILESTONE_STATUS_MAP["in progress"] == "in-progress"

    def test_unknown_falls_back_to_upcoming(self):
        assert MILESTONE_STATUS_MAP.get("delayed",  "upcoming") == "upcoming"
        assert MILESTONE_STATUS_MAP.get("random",   "upcoming") == "upcoming"


class TestParseMilestones:
    def _make_md(self, status_str):
        return f"""\
## Appendix: Dashboard Export

### 專案進度
| 專案名稱 | 狀態 | 進度 % | 本週更新 | 備註 |
| --- | --- | --- | --- | --- |

### Action Items
| # | 任務描述 | 負責人 | 目標日期 | 狀態 | 分類 |
| --- | --- | --- | --- | --- | --- |

### Risks
| Risk ID | 風險描述 | 嚴重度 | 負責人 | 因應措施 |
| --- | --- | --- | --- | --- |

### 里程碑
| 日期 | 里程碑事項 | 團隊 | 狀態 |
| --- | --- | --- | --- |
| 2026-06-20 | Beta 上線 | media-agent | {status_str} |
"""

    def _parse(self, status_str):
        text = self._make_md(status_str)
        ms = parse_milestones(text, "W25", "2026-06-15", [], v2=True)
        return ms[0]["status"] if ms else None

    def test_upcoming_stays_upcoming(self):
        assert self._parse("upcoming") == "upcoming"

    def test_done_stays_done(self):
        assert self._parse("done") == "done"

    def test_completed_becomes_done(self):
        assert self._parse("completed") == "done"

    def test_in_progress_with_space(self):
        assert self._parse("in progress") == "in-progress"

    def test_unknown_status_becomes_upcoming(self):
        assert self._parse("delayed") == "upcoming"

    def test_milestone_name_and_date_parsed(self):
        text = self._make_md("upcoming")
        ms = parse_milestones(text, "W25", "2026-06-15", [], v2=True)
        assert ms[0]["name"] == "Beta 上線"
        assert ms[0]["date"] == "2026-06-20"
        assert ms[0]["team"] == "media-agent"

    def test_status_preserved_for_existing(self):
        existing = [{"id": "ms-w25-01", "name": "Beta 上線", "status": "in-progress", "_createdAt": "2026-01-01T00:00:00.000Z"}]
        text = self._make_md("upcoming")
        ms = parse_milestones(text, "W25", "2026-06-15", existing, v2=True)
        assert ms[0]["status"] == "in-progress"

    def test_done_in_md_overrides_existing(self):
        existing = [{"id": "ms-w25-01", "name": "Beta 上線", "status": "in-progress", "_createdAt": "2026-01-01T00:00:00.000Z"}]
        text = self._make_md("done")
        ms = parse_milestones(text, "W25", "2026-06-15", existing, v2=True)
        assert ms[0]["status"] == "done"


# ── find_existing ─────────────────────────────────────────────────────────────

class TestFindExisting:
    def test_exact_match(self):
        items = [{"id": "a1", "task": "部署測試環境"}]
        found = find_existing(items, "task", "部署測試環境")
        assert found is not None
        assert found["id"] == "a1"

    def test_no_match(self):
        items = [{"id": "a1", "task": "部署測試環境"}]
        assert find_existing(items, "task", "完全不同的任務") is None

    def test_empty_list(self):
        assert find_existing([], "task", "任意") is None

    def test_leading_trailing_whitespace(self):
        items = [{"id": "a1", "task": "部署測試環境"}]
        assert find_existing(items, "task", "  部署測試環境  ") is not None

    def test_substring_match(self):
        # value_clean[:15] 出現在 existing_val 中（截斷標題情境）
        items = [{"id": "a1", "task": "部署測試環境到 Production 伺服器（含 CI）"}]
        found = find_existing(items, "task", "部署測試環境到 Production（不含 DB）")
        assert found is not None


# ── parse_projects [keep] 標記 ────────────────────────────────────────────────

class TestParseProjectsKeep:
    def _make_md(self, progress_str):
        return f"""\
## Appendix: Dashboard Export

### 專案進度
| 專案名稱 | 狀態 | 進度 % | 本週更新 | 備註 |
| --- | --- | --- | --- | --- |
| AIWize | on-track | {progress_str} | 完成 MVP | - |

### Action Items
| # | 任務描述 | 負責人 | 目標日期 | 狀態 | 分類 |
| --- | --- | --- | --- | --- | --- |

### Risks
| Risk ID | 風險描述 | 嚴重度 | 負責人 | 因應措施 |
| --- | --- | --- | --- | --- |

### 里程碑
| 日期 | 里程碑事項 | 團隊 | 狀態 |
| --- | --- | --- | --- |
"""

    def test_numeric_progress(self):
        text = self._make_md("75")
        projects = parse_projects(text, "W25", "2026-06-15", [], v2=True)
        assert projects[0]["progress"] == 75

    def test_keep_uses_existing_progress(self):
        existing = [{"id": "proj-w25-01", "name": "AIWize", "progress": 60, "_createdAt": "2026-01-01T00:00:00.000Z"}]
        text = self._make_md("[keep]")
        projects = parse_projects(text, "W25", "2026-06-15", existing, v2=True)
        assert projects[0]["progress"] == 60

    def test_keep_no_existing_defaults_to_zero(self):
        text = self._make_md("[keep]")
        projects = parse_projects(text, "W25", "2026-06-15", [], v2=True)
        assert projects[0]["progress"] == 0

    def test_progress_with_percent_sign(self):
        text = self._make_md("80%")
        projects = parse_projects(text, "W25", "2026-06-15", [], v2=True)
        assert projects[0]["progress"] == 80

    def test_invalid_progress_defaults_to_zero(self):
        text = self._make_md("N/A")
        projects = parse_projects(text, "W25", "2026-06-15", [], v2=True)
        assert projects[0]["progress"] == 0

    def test_skip_dash_row(self):
        md = """\
## Appendix: Dashboard Export

### 專案進度
| 專案名稱 | 狀態 | 進度 % | 本週更新 | 備註 |
| --- | --- | --- | --- | --- |
| - | - | - | - | - |
| AIWize | on-track | 50 | - | - |

### Action Items
| # | 任務描述 | 負責人 | 目標日期 | 狀態 | 分類 |
| --- | --- | --- | --- | --- | --- |

### Risks
| Risk ID | 風險描述 | 嚴重度 | 負責人 | 因應措施 |
| --- | --- | --- | --- | --- |

### 里程碑
| 日期 | 里程碑事項 | 團隊 | 狀態 |
| --- | --- | --- | --- |
"""
        projects = parse_projects(md, "W25", "2026-06-15", [], v2=True)
        assert len(projects) == 1
        assert projects[0]["name"] == "AIWize"


class TestParseProjectsPrevExisting:
    """AC-1/2/3/4/5：上週 carry-forward 測試"""

    _MD = """\
## Appendix: Dashboard Export

### 專案進度
| 專案名稱 | 狀態 | 進度 % | 本週更新 | 備註 |
| --- | --- | --- | --- | --- |
| AIWize | at-risk | 65 | 修正登入 bug | - |

### Action Items
| # | 任務描述 | 負責人 | 目標日期 | 狀態 | 分類 |
| --- | --- | --- | --- | --- | --- |

### Risks
| Risk ID | 風險描述 | 嚴重度 | 負責人 | 因應措施 |
| --- | --- | --- | --- | --- |

### 里程碑
| 日期 | 里程碑事項 | 團隊 | 狀態 |
| --- | --- | --- | --- |
"""

    _PREV = [
        {
            "id": "proj-w26-01",
            "name": "AIWize",
            "team": "learnmode",
            "owner": "Alex",
            "targetDate": "2026-09-30",
            "progress": 60,
            "status": "on-track",
            "_createdAt": "2026-01-01T00:00:00.000Z",
        }
    ]

    def test_owner_carried_from_prev(self):
        """AC-1：新週次匯入後，owner 應等於上週同名專案的 owner"""
        projects = parse_projects(self._MD, "W27", "2026-06-30", [], v2=True, prev_existing=self._PREV)
        assert projects[0]["owner"] == "Alex"

    def test_target_date_carried_from_prev(self):
        """AC-2：新週次匯入後，targetDate 應等於上週同名專案的 targetDate"""
        projects = parse_projects(self._MD, "W27", "2026-06-30", [], v2=True, prev_existing=self._PREV)
        assert projects[0]["targetDate"] == "2026-09-30"

    def test_status_from_appendix_not_prev(self):
        """AC-3：status 仍由 Appendix 表格決定，不被 carry-forward 覆蓋"""
        projects = parse_projects(self._MD, "W27", "2026-06-30", [], v2=True, prev_existing=self._PREV)
        assert projects[0]["status"] == "at-risk"   # Appendix 寫 at-risk，prev 是 on-track

    def test_progress_from_appendix_not_prev(self):
        """AC-3：progress 仍由 Appendix 表格決定"""
        projects = parse_projects(self._MD, "W27", "2026-06-30", [], v2=True, prev_existing=self._PREV)
        assert projects[0]["progress"] == 65   # Appendix 寫 65，prev 是 60

    def test_no_prev_owner_empty(self):
        """AC-4：上週無對應專案時，owner 為空（行為同現在）"""
        projects = parse_projects(self._MD, "W27", "2026-06-30", [], v2=True, prev_existing=[])
        assert projects[0]["owner"] == ""

    def test_no_prev_target_date_empty(self):
        """AC-4：上週無對應專案時，targetDate 為空（行為同現在）"""
        projects = parse_projects(self._MD, "W27", "2026-06-30", [], v2=True, prev_existing=[])
        assert projects[0]["targetDate"] == ""

    def test_existing_takes_priority_over_prev(self):
        """existing_item 存在時，prev_existing 不干擾"""
        existing = [
            {
                "id": "proj-w27-existing",
                "name": "AIWize",
                "team": "media-agent",
                "owner": "Bob",
                "targetDate": "2026-12-31",
                "progress": 70,
                "status": "on-track",
                "_createdAt": "2026-01-02T00:00:00.000Z",
            }
        ]
        projects = parse_projects(self._MD, "W27", "2026-06-30", existing, v2=True, prev_existing=self._PREV)
        assert projects[0]["owner"] == "Bob"        # 來自 existing，非 prev
        assert projects[0]["targetDate"] == "2026-12-31"

    def test_none_prev_existing_no_crash(self):
        """AC-5 邊界：prev_existing=None 不 crash"""
        projects = parse_projects(self._MD, "W27", "2026-06-30", [], v2=True, prev_existing=None)
        assert len(projects) == 1
