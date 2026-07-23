from pydantic import BaseModel, ConfigDict, Field


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
    status: str = "active"

    model_config = ConfigDict(populate_by_name=True)


class StudentCreate(StudentBase):
    id: str | None = None  # auto-generated when omitted


class StudentUpdate(BaseModel):
    student_id: str | None = None
    name: str | None = None
    class_: str | None = None
    school_year: str | None = None
    group_id: str | None = None
    status: str | None = None


class StudentOut(StudentBase):
    id: str
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


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


# ---------- Page permissions ----------
# The API payload shape is dict[str, PagePermission] keyed by page_key.
class PagePermission(BaseModel):
    viewer: bool
    editor: bool
    model_config = ConfigDict(from_attributes=True)
