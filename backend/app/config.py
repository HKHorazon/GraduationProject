from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://app:app@localhost:5432/graduation"
    jwt_secret: str = "change-me-in-prod"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    cors_origins: str = "http://localhost:8080"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("database_url")
    @classmethod
    def _force_psycopg_driver(cls, v: str) -> str:
        # Railway's Postgres plugin hands out postgresql://… (and some hosts use
        # the legacy postgres://). SQLAlchemy + psycopg3 needs the +psycopg driver.
        if v.startswith("postgres://"):
            v = "postgresql://" + v[len("postgres://"):]
        if v.startswith("postgresql://"):
            v = "postgresql+psycopg://" + v[len("postgresql://"):]
        return v

    @model_validator(mode="after")
    def _require_secret_outside_sqlite(self) -> "Settings":
        # SQLite = local dev; keep working without a real secret. Anywhere else
        # (Postgres/prod) an unset or placeholder JWT_SECRET is a fatal misconfig.
        is_sqlite = self.database_url.startswith("sqlite")
        if not is_sqlite and self.jwt_secret in ("", "change-me-in-prod"):
            raise RuntimeError(
                "JWT_SECRET is unset or still the placeholder 'change-me-in-prod'. "
                "Set a strong JWT_SECRET in the environment before starting the "
                "backend against a non-SQLite database."
            )
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
