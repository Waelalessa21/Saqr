from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.core.database import engine, Base
from app.modules.auth.routes import router as auth_router
from app.modules.games.routes import router as admin_games_router
from app.modules.games.public_routes import router as public_games_router
from app.modules.suggestions.routes import router as suggestions_router

Base.metadata.create_all(bind=engine)


def sync_missing_columns():
    """Add columns that exist in the models but not yet in the database."""
    inspector = inspect(engine)
    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            existing = {c["name"] for c in inspector.get_columns(table.name)}
            for column in table.columns:
                if column.name not in existing:
                    col_type = column.type.compile(engine.dialect)
                    conn.execute(text(f'ALTER TABLE {table.name} ADD COLUMN {column.name} {col_type}'))


sync_missing_columns()

app = FastAPI(title="Saqr API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_games_router)
app.include_router(public_games_router)
app.include_router(suggestions_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
