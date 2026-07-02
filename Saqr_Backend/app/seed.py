from app.core.database import SessionLocal
from app.core.security import hash_password
from app.modules.auth.models import User


def seed():
    db = SessionLocal()
    try:
        if db.query(User).filter(User.role == "admin").first():
            print("Admin user already exists, skipping seed.")
            return

        admin = User(
            name="الادارة",
            email="admin@saqr.com",
            hashed_password=hash_password("admin123"),
            role="admin",
        )
        db.add(admin)
        db.commit()
        print("Admin user created: admin@saqr.com / admin123")
    finally:
        db.close()


if __name__ == "__main__":
    from app.core.database import Base, engine
    Base.metadata.create_all(bind=engine)
    seed()
