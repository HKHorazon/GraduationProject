# 資料庫 ER Model

由 [`backend/app/models.py`](../backend/app/models.py) 整理。GitHub / VSCode（裝 Mermaid 外掛）可直接渲染。

```mermaid
erDiagram
    teachers ||--o{ group_teachers : advises
    groups   ||--o{ group_teachers : has
    groups   ||--o{ students : members
    groups   |o--o| students : leader
    teachers ||--o{ accounts : linked

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
        string  role "super_admin editor viewer"
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

## 備註

- `audit_logs` / `db_logs` 的 ref 欄位**刻意無 FK**：保留歷史，原資料刪除後紀錄仍在（無參照完整性）。
- `role` / `status` / `event` / `method` 等為**字串欄位、無 enum 約束**，由應用層把關。
- `students` ↔ `groups` 循環外鍵：SQLite dev 用 `use_alter` 自動建，Postgres 走 Alembic（`0001`）。
- Mermaid 不支援「同兩表間多條具名關係」並排顯示，members 與 leader 兩條 `groups–students` 已分行標註。
