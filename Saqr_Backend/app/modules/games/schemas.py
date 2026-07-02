from datetime import datetime

from pydantic import BaseModel


class GameCreate(BaseModel):
    title: str


class GameOut(BaseModel):
    id: int
    title: str
    status: str
    created_by: int
    question_count: int = 0

    class Config:
        from_attributes = True


class QuestionCreate(BaseModel):
    category_id: int
    points: int
    text: str
    answer: str
    options: list[str] | None = None


class QuestionUpdate(BaseModel):
    text: str | None = None
    answer: str | None = None
    options: list[str] | None = None


class QuestionOut(BaseModel):
    id: int
    game_id: int
    category_id: int
    points: int
    text: str
    answer: str
    options: list[str] | None = None

    class Config:
        from_attributes = True


class GameDetail(BaseModel):
    id: int
    title: str
    status: str
    created_by: int
    questions: list[QuestionOut] = []

    class Config:
        from_attributes = True


class GameResultCreate(BaseModel):
    game_id: int
    team1: str
    team2: str
    score1: int
    score2: int
    winner: str | None = None
    categories: list[int] | None = None


class GameResultOut(BaseModel):
    id: int
    game_id: int
    team1: str
    team2: str
    score1: int
    score2: int
    winner: str | None
    categories: list[int] | None = None
    played_at: datetime | None = None

    class Config:
        from_attributes = True


class QuestionPublic(BaseModel):
    id: int
    game_id: int
    category_id: int
    points: int
    text: str
    options: list[str] | None = None

    class Config:
        from_attributes = True


class GameDetailPublic(BaseModel):
    id: int
    title: str
    status: str
    questions: list[QuestionPublic] = []

    class Config:
        from_attributes = True


class GameSessionSave(BaseModel):
    game_id: int
    categories: list[int]
    team1: str
    team2: str
    score1: int = 0
    score2: int = 0
    turn: int = 0
    answered: list[str] = []
    results: dict[str, str] = {}
    used_power_ups: list[list[str]] = [[], []]


class GameSessionOut(BaseModel):
    game_id: int
    categories: list[int]
    team1: str
    team2: str
    score1: int
    score2: int
    turn: int
    answered: list[str]
    results: dict[str, str]
    used_power_ups: list[list[str]]

    class Config:
        from_attributes = True


class GameEntryOut(BaseModel):
    action: str
    game_id: int | None = None
    game_title: str | None = None
    game_number: int | None = None
    total_games: int = 0
    completed_games: int = 0
    all_completed: bool = False
    session: GameSessionOut | None = None
