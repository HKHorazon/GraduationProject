# 姓名個資混淆：未登入時人名以「張O明」形式顯示。
# 規則：保留姓氏（第一字）與最後一字，中間以 O 取代；
# 兩字名（張明）→ 張O；單字或空值原樣返回。
# 對應前端 frontend/src/lib/privacy.js 的 maskName。
def mask_name(name: str | None) -> str | None:
    if not name or not isinstance(name, str):
        return name
    chars = list(name.strip())
    if len(chars) < 2:
        return name
    if len(chars) == 2:
        return chars[0] + "O"
    return chars[0] + "O" * (len(chars) - 2) + chars[-1]
