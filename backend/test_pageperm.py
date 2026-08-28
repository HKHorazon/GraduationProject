import json, urllib.request, urllib.parse, urllib.error
B = "http://127.0.0.1:8000"

def req(method, path, token=None, body=None, form=False):
    data = None
    headers = {}
    if body is not None:
        if form:
            data = urllib.parse.urlencode(body).encode()
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        else:
            data = json.dumps(body).encode()
            headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(B + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            raw = resp.read().decode()
            return resp.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        return e.code, (json.loads(raw) if raw else None)

def login(u):
    s, b = req("POST", "/auth/login", body={"username": u, "password": "password"}, form=True)
    assert s == 200, (u, s, b)
    return b["access_token"]

admin, editor, viewer = login("admin"), login("chen"), login("wang")

# --- 未登入（guest）---
assert req("GET", "/students")[0] == 200, "guest 仍可瀏覽學生（遮蔽姓名）"
assert req("GET", "/reviews")[0] == 403, "guest 不該讀得到審查評分"
assert req("GET", "/audit-logs")[0] == 403, "guest 不該讀得到異動紀錄"
assert req("POST", "/teachers", body={"name": "X"})[0] == 401, "guest 不該能寫"

# --- viewer（預設只有 students/groups view）---
assert req("GET", "/audit-logs", viewer)[0] == 403
assert req("GET", "/reviews", viewer)[0] == 403
assert req("POST", "/teachers", viewer, {"name": "X"})[0] == 403

# --- editor（預設全 edit）---
assert req("GET", "/audit-logs", editor)[0] == 200
assert req("GET", "/reviews", editor)[0] == 200
s, t = req("POST", "/teachers", editor, {"name": "測試老師"})
assert s == 201, (s, t)
assert req("DELETE", f"/teachers/{t['id']}", editor)[0] == 204

# --- 權限表是真的授權來源：給 viewer 開 audit-logs 唯讀 ---
s, m = req("GET", "/permissions")
assert s == 200
m["perms"]["viewer"]["audit-logs"] = "view"
s, m = req("PUT", "/permissions", admin, m["perms"])
assert s == 200, (s, m)
assert req("GET", "/audit-logs", viewer)[0] == 200, "開了唯讀就該讀得到"
assert req("POST", "/teachers", viewer, {"name": "X"})[0] == 403, "唯讀不該能寫"

# 升成 edit → 可以寫組別
m["perms"]["viewer"]["groups"] = "edit"
assert req("PUT", "/permissions", admin, m["perms"])[0] == 200
s, g = req("POST", "/groups", viewer, {"number": 99, "name": "權限測試組", "school_year": "113"})
assert s == 201, (s, g)
assert req("DELETE", f"/groups/{g['id']}", viewer)[0] == 204

# 收回 → 立刻擋住（groups 還原成預設的 view，別把測試殘留留在 DB）
m["perms"]["viewer"]["groups"] = "view"
m["perms"]["viewer"]["audit-logs"] = "none"
assert req("PUT", "/permissions", admin, m["perms"])[0] == 200
assert req("GET", "/audit-logs", viewer)[0] == 403
assert req("POST", "/groups", viewer, {"number": 98, "name": "X", "school_year": "113"})[0] == 403,     "view 不等於 edit"

# --- 自由分組：新增 / 改名 / 設權限 / 刪除 ---
s, m = req("POST", "/permissions/groups", admin, {"label": "助教"})
assert s == 201, (s, m)
key = [g["key"] for g in m["groups"] if g["label"] == "助教"][0]
assert req("POST", "/permissions/groups", admin, {"label": "助教"})[0] == 409, "重名要擋"
assert req("PATCH", f"/permissions/groups/{key}", admin, {"label": "助教長"})[0] == 200
# 內建不可刪
assert req("DELETE", "/permissions/groups/guest", admin)[0] == 400
assert req("DELETE", "/permissions/groups/super_admin", admin)[0] == 400
# 有帳號在用就不可刪
assert req("DELETE", "/permissions/groups/editor", admin)[0] == 409
# 非管理員不可動分組
assert req("POST", "/permissions/groups", editor, {"label": "X"})[0] == 403
assert req("DELETE", f"/permissions/groups/{key}", admin)[0] == 200

# --- 帳號的分組必須存在，且不可設成 guest ---
assert req("PATCH", "/accounts/u4", admin, {"role": "nope"})[0] == 400
assert req("PATCH", "/accounts/u4", admin, {"role": "guest"})[0] == 400
assert req("PATCH", "/accounts/u4", admin, {"role": "viewer"})[0] == 200

# --- 姓名遮蔽跟著權限走（不是只看有沒有登入）---
def names(token=None):
    s, rows = req("GET", "/students", token)
    assert s == 200, s
    return [r["name"] for r in rows]

def teacher_names(token=None):
    s, rows = req("GET", "/teachers", token)
    assert s == 200, s
    return [r["name"] for r in rows]

assert all("O" in n for n in names()), "未登入的學生姓名要遮蔽"
assert all("O" in n for n in teacher_names()), "未登入的老師姓名也要遮蔽"
assert not any("O" in n for n in names(editor)), "editor 看得到真名"

s, m = req("GET", "/permissions")
m["perms"]["viewer"]["students"] = "none"
assert req("PUT", "/permissions", admin, m["perms"])[0] == 200
assert all("O" in n for n in names(viewer)), "沒有學生列表檢視權 → 姓名遮蔽（就算登入了）"
m["perms"]["viewer"]["students"] = "view"
assert req("PUT", "/permissions", admin, m["perms"])[0] == 200
assert not any("O" in n for n in names(viewer)), "還原檢視權 → 看得到真名"

# --- 新分組是 fail-closed：沒有任何 row 就什麼都不給 ---
s, m = req("POST", "/permissions/groups", admin, {"label": "測試分組"})
assert s == 201, (s, m)
gkey = [g["key"] for g in m["groups"] if g["label"] == "測試分組"][0]
assert m["perms"].get(gkey) in ({}, None), "新分組不該預設拿到任何權限"
s, acc = req("POST", "/accounts", admin,
             {"username": "perm_probe", "password": "password", "role": gkey})
assert s == 201, (s, acc)
probe = login("perm_probe")
assert all("O" in n for n in names(probe)), "新分組沒有 students 權 → 姓名要遮蔽"
assert req("GET", "/audit-logs", probe)[0] == 403
assert req("POST", "/teachers", probe, {"name": "X"})[0] == 403
assert req("DELETE", f"/accounts/{acc['id']}", admin)[0] == 204
assert req("DELETE", f"/permissions/groups/{gkey}", admin)[0] == 200

# --- 權限矩陣的輸入驗證 ---
assert req("PUT", "/permissions", admin, {"viewer": {"no-such-page": "view"}})[0] == 400
assert req("PUT", "/permissions", admin, {"viewer": {"students": "superuser"}})[0] == 422

# --- 管理員帳號不可刪（刪光就沒人進得去帳號管理）---
s, acc = req("POST", "/accounts", admin,
             {"username": "admin_probe", "password": "password", "role": "super_admin"})
assert s == 201, (s, acc)
assert req("DELETE", f"/accounts/{acc['id']}", admin)[0] == 400, "管理員帳號不可刪"
assert req("PATCH", f"/accounts/{acc['id']}", admin, {"role": "viewer"})[0] == 200
assert req("DELETE", f"/accounts/{acc['id']}", admin)[0] == 204, "改成一般分組後才可刪"

print("ALL BACKEND PERMISSION CHECKS PASSED")

