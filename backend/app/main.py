from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import accounts, audit, auth, groups, permissions, reviews, students, teachers

app = FastAPI(title="Graduation Project API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(students.router, prefix="/students", tags=["students"])
app.include_router(groups.router, prefix="/groups", tags=["groups"])
app.include_router(teachers.router, prefix="/teachers", tags=["teachers"])
app.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
app.include_router(audit.router, prefix="/audit-logs", tags=["audit"])
app.include_router(permissions.router, prefix="/permissions", tags=["permissions"])
app.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
