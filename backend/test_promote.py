"""全體升級的班級字串規則自我檢查：python test_promote.py"""
from app.routers.students import _promote_class, split_class

# 拆解：年級字之前（含）是前段，之後是班別
assert split_class("日三甲") == ("日三", "甲")
assert split_class("三甲") == ("三", "甲")
assert split_class("甲") == ("", "甲")
assert split_class("甲(畢業)") == ("", "甲(畢業)")
assert split_class(None) == ("", "")

# 升級：年級 +1
assert _promote_class("日一甲") == "日二甲"
assert _promote_class("日三甲") == "日四甲"
assert _promote_class("三乙") == "四乙"
assert _promote_class("進二甲") == "進三甲"

# 四年級（含以上）畢業，只留班別
assert _promote_class("日四甲") == "甲(畢業)"
assert _promote_class("四乙") == "乙(畢業)"

# 跳過：已畢業、看不出年級、空值
assert _promote_class("甲(畢業)") is None
assert _promote_class("甲") is None
assert _promote_class("") is None
assert _promote_class(None) is None

print("ok")
