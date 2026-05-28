# Database Schema

## Tables

### `teachers`
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | UUID PK | |
| user_id | UUID FK → auth.users | nullable，superadmin 等非老師帳號不綁定 |
| name | TEXT | |

### `students`
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | UUID PK | |
| student_id | TEXT UNIQUE | 學號 |
| name | TEXT | |
| class | TEXT | 班級 |
| school_year | TEXT | 學年度（e.g. 2024-2025） |
| group_id | UUID FK → groups | nullable，未分組為 null |

### `groups`
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | UUID PK | |
| number | INT | 組別編號（非 unique，不同學年可重複） |
| name | TEXT | 專題題目名稱 |
| school_year | TEXT | 學年度 |
| UNIQUE | (number, school_year) | 聯合唯一 |

### `group_teachers`（多對多橋接）
| 欄位 | 類型 | 說明 |
|------|------|------|
| group_id | UUID FK → groups | |
| teacher_id | UUID FK → teachers | |
| PK | (group_id, teacher_id) | |

### `audit_logs`（待定）
> 記錄業務動作（非 CRUD），具體動作清單待討論。

---

## 設計決策

- 一個學生只能屬於一個組（`students.group_id`）
- 一個組可以有多個指導老師（`group_teachers`），但多老師是特例非常態
- 每個指導老師可帶多個組
- 組別編號 + 年級 + 學年度 = 唯一識別
- 所有老師都有帳號（editor 或 viewer），superadmin 等帳號不一定是老師
- 評分功能之後再做（會有多次評分）

## 待確認

- [ ] `audit_logs` 要記錄哪些業務動作
- [ ] 帳號與角色的詳細清單（到時候提供）
