from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    status = Column(String, nullable=False, default="draft")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    questions = relationship("Question", back_populates="game", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, nullable=False)
    points = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    answer = Column(String, nullable=False)
    options = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    game = relationship("Game", back_populates="questions")


class GameResult(Base):
    __tablename__ = "game_results"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    team1 = Column(String, nullable=False)
    team2 = Column(String, nullable=False)
    score1 = Column(Integer, nullable=False, default=0)
    score2 = Column(Integer, nullable=False, default=0)
    winner = Column(String, nullable=True)
    categories = Column(JSON, nullable=True)
    played_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class GameSession(Base):
    __tablename__ = "game_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    categories = Column(JSON, nullable=False)
    team1 = Column(String, nullable=False)
    team2 = Column(String, nullable=False)
    score1 = Column(Integer, nullable=False, default=0)
    score2 = Column(Integer, nullable=False, default=0)
    turn = Column(Integer, nullable=False, default=0)
    answered = Column(JSON, nullable=False, default=list)
    results = Column(JSON, nullable=False, default=dict)
    used_power_ups = Column(JSON, nullable=False, default=list)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
