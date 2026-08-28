from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# active 以外都是離開：休學／退學／抵免（inactive 是舊資料）
StudentStatus = Literal["active", "suspended", "withdrawn", "exempted", "inactive"]


# ---------- Teacher ----------
class TeacherBase(BaseModel):
    name: str


class TeacherCreate(TeacherBase):
    id: str | None = None  # auto-generated when omitted


class TeacherOut(TeacherBase):
    id: str
    model_config = ConfigDict(from_attributes=True)


# ---------- Student ----------
class StudentBase(BaseModel):
    student_id: str
    name: str
    class_: str | None = None
    school_year: str
    group_id: str | None = None
    status: StudentStatus = "active"
    advisor_id: str | None = None   # 代理指導老師，只在未分組時有意義

    model_config = ConfigDict(populate_by_name=True)


class StudentCreate(StudentBase):
    id: str | None = None  # auto-generated when omitted


class StudentUpdate(BaseModel):
    student_id: str | None = None
    name: str | None = None
    class_: str | None = None
    school_year: str | None = None
    group_id: str | None = None
    status: StudentStatus | None = None
    advisor_id: str | None = None


class StudentOut(StudentBase):
    id: str
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class PromoteResult(BaseModel):
    """全體升級的結果統計；students 只含有變動的列，供前端就地更新。"""
    promoted: int
    graduated: int
    skipped: int
    students: list[StudentOut] = []


# ---------- Group ----------
class GroupBase(BaseModel):
    number: int
    name: str
    category: str | None = None
    school_year: str
    leader_id: str | None = None
    teacher_ids: list[str] = []


class GroupCreate(GroupBase):
    id: str | None = None  # auto-generated when omitted


class GroupUpdate(BaseModel):
    number: int | None = None
    name: str | None = None
    category: str | None = None
    school_year: str | None = None
    leader_id: str | None = None
    teacher_ids: list[str] | None = None


class GroupOut(BaseModel):
    id: str
    number: int
    name: str
    category: str | None = None
    school_year: str
    leader_id: str | None = None
    teacher_ids: list[str] = []
    model_config = ConfigDict(from_attributes=True)


class GroupReorder(BaseModel):
    school_year: str
    ordered_ids: list[str]  # group ids in the desired order; renumbered 1..N


# ---------- Auth ----------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AccountOut(BaseModel):
    id: str
    username: str
    role: str
    active: bool
    teacher_id: str | None = None
    model_config = ConfigDict(from_attributes=True)


class AccountCreate(BaseModel):
    username: str
    password: str
    role: str = "viewer"
    active: bool = True
    teacher_id: str | None = None


class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(min_length=6)


class AccountUpdate(BaseModel):
    username: str | None = None
    password: str | None = None
    role: str | None = None
    active: bool | None = None
    teacher_id: str | None = None


# ---------- Audit log ----------
from datetime import datetime  # noqa: E402


class AuditLogOut(BaseModel):
    id: int
    created_at: datetime
    actor: str
    event: str
    summary: str
    student_id: str | None = None
    teacher_id: str | None = None
    group_id: str | None = None
    model_config = ConfigDict(from_attributes=True)


# ---------- Review (審查評分) ----------
class ReviewCriterion(BaseModel):
    name: str
    weight: float = Field(default=100, gt=0)


class ReviewBase(BaseModel):
    name: str
    school_year: str
    criteria: list[ReviewCriterion] = Field(min_length=1)
    reviewers: list[str] = []          # ['t1', '外:王大明']
    internal_weight: float = Field(default=60, ge=0)   # 系上老師平均佔比
    external_weight: float = Field(default=40, ge=0)   # 外審委員平均佔比
    is_open: bool = True


class ReviewCreate(ReviewBase):
    id: str | None = None  # auto-generated when omitted


class ReviewUpdate(BaseModel):
    name: str | None = None
    school_year: str | None = None
    criteria: list[ReviewCriterion] | None = None
    reviewers: list[str] | None = None
    internal_weight: float | None = Field(default=None, ge=0)
    external_weight: float | None = Field(default=None, ge=0)
    is_open: bool | None = None


class ReviewOut(ReviewBase):
    id: str


class ReviewScoreIn(BaseModel):
    group_id: str
    reviewer: str            # 系上老師 = Teacher.id（如 t3）；外審委員 = '外:王大明'
    scores: list[float]      # 對齊該審查的 criteria 順序
    comment: str | None = None


class ReviewScoreOut(ReviewScoreIn):
    id: int
    review_id: str
    total: float             # 依 criteria 權重算出的加權總分


# ---------- Page permissions ----------
# 權限分組（viewer/editor 這種）不再寫死，改成資料表；Account.role 存 group key。
PermLevel = Literal["none", "view", "edit"]


class PermissionGroupOut(BaseModel):
    key: str
    label: str
    is_admin: bool
    builtin: bool
    sort: int
    model_config = ConfigDict(from_attributes=True)


class PermissionGroupCreate(BaseModel):
    label: str
    key: str | None = None      # auto-slugged from label when omitted
    is_admin: bool = False


class PermissionGroupUpdate(BaseModel):
    label: str | None = None
    is_admin: bool | None = None
    sort: int | None = None


class PermissionMatrix(BaseModel):
    groups: list[PermissionGroupOut]
    perms: dict[str, dict[str, PermLevel]]      # group_key -> page_key -> level
    model_config = ConfigDict(from_attributes=True)
