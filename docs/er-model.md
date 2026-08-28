# 資料庫 ER Model

由 [`backend/app/models.py`](../backend/app/models.py) 整理。GitHub / VSCode（裝 Mermaid 外掛）可直接渲染。

```mermaid
erDiagram
    teachers ||--o{ group_teachers : advises
    groups   ||--o{ group_teachers : has
    groups   ||--o{ students : members
    groups   |o--o| students : leader
    teachers ||--o{ accounts : linked
    permission_groups ||--o{ page_permissions : grants
    reviews  ||--o{ review_scores : has
    groups   ||--o{ review_scores : scored

    teachers {
        string id PK
        string name
    }

    groups {
        string  id PK
        int     number
        string  name
        string  category "nullable"
        string  school_year "index"
        string  leader_id FK "students.id SET NULL circular"
    }

    group_teachers {
        string group_id PK "FK groups.id CASCADE"
        string teacher_id PK "FK teachers.id CASCADE"
    }

    students {
        string id PK
        string student_id UK "unique index"
        string name
        string class_ "nullable col name is class"
        string school_year "index"
        string group_id FK "groups.id SET NULL"
        string status "active or inactive"
    }

    accounts {
        string  id PK
        string  username UK "unique index"
        string  password_hash
        string  role "FK permission_groups.key no constraint"
        boolean active
        string  teacher_id FK "teachers.id SET NULL"
    }

    audit_logs {
        int      id PK
        datetime created_at "index"
        string   actor
        string   event "index"
        string   summary
        string   student_id "soft ref no FK"
        string   teacher_id "soft ref no FK"
        string   group_id "soft ref no FK"
    }

    reviews {
        string   id PK "rv n"
        string   name
        string   school_year "index"
        string   criteria "JSON name weight"
        string   reviewers "JSON t1 or 外:王大明"
        float    internal_weight
        float    external_weight
        boolean  is_open
        datetime created_at
    }

    review_scores {
        int      id PK "autoincrement"
        string   review_id FK "reviews.id CASCADE"
        string   group_id FK "groups.id CASCADE"
        string   reviewer "teachers.id 或 外:姓名 soft ref"
        string   scores "JSON 對齊 criteria"
        string   comment "nullable"
        datetime updated_at
        string   UK "review_id group_id reviewer unique"
    }

    permission_groups {
        string  key PK "Account.role stores this"
        string  label "zh-TW 顯示名稱"
        boolean is_admin "全權，含帳號管理／權限設定"
        boolean builtin "guest 與管理員分組，不可刪"
        int     sort
    }

    page_permissions {
        string group_key PK "FK permission_groups.key CASCADE"
        string page_key PK "frontend PAGES key"
        string level "none view edit"
    }

    db_logs {
        int      id PK
        datetime created_at "index"
        string   actor
        string   method "create update delete import"
        string   table_name
        string   record_id
        string   payload "JSON"
    }
```

## 關係摘要

| 關係 | 型態 | 刪除行為 |
|------|------|----------|
| Group ↔ Teacher | M:N（關聯表 `group_teachers`） | 兩端 CASCADE |
| Group → Student（members） | 1:N（`students.group_id`） | SET NULL |
| Group → Student（leader） | 1:1（`groups.leader_id`） | SET NULL，與 members 形成循環 FK，`use_alter` 破環 |
| Account → Teacher | N:1（`accounts.teacher_id`） | SET NULL |
| Review → ReviewScore | 1:N（`review_scores.review_id`） | CASCADE |
| Group → ReviewScore | 1:N（`review_scores.group_id`） | CASCADE |
| PermissionGroup → PagePermission | 1:N（`page_permissions.group_key`） | CASCADE |
| Account → PermissionGroup | N:1（`accounts.role` 存 key，**無 FK**） | 應用層擋（刪分組前先檢查有無帳號在用） |

## 備註

- `audit_logs` / `db_logs` 的 ref 欄位**刻意無 FK**：保留歷史，原資料刪除後紀錄仍在（無參照完整性）。
- `role` / `status` / `event` / `method` / `level` 等為**字串欄位、無 enum 約束**，由應用層把關。
- `accounts.role` 指向 `permission_groups.key` 但**刻意沒有 FK**：分組可自由增刪，改用 `routers/permissions.py` 的 409 檢查與 `routers/accounts.py` 的 400 檢查把關。
- `students` ↔ `groups` 循環外鍵：SQLite dev 用 `use_alter` 自動建，Postgres 走 Alembic（`0001`）。
- Mermaid 不支援「同兩表間多條具名關係」並排顯示，members 與 leader 兩條 `groups–students` 已分行標註。
