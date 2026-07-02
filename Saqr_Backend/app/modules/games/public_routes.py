from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.auth.models import User
from app.modules.games.models import Game, GameResult, GameSession, Question
from app.modules.games.schemas import (
    GameOut,
    GameDetailPublic,
    GameResultCreate,
    GameResultOut,
    GameEntryOut,
    GameSessionOut,
    GameSessionSave,
)

router = APIRouter(prefix="/api/games", tags=["games"])


def _published_games(db: Session) -> list[Game]:
    return db.query(Game).filter(Game.status == "published").order_by(Game.id.asc()).all()


def _completed_game_ids(db: Session, user_id: int) -> set[int]:
    rows = (
        db.query(GameResult.game_id)
        .filter(GameResult.user_id == user_id, GameResult.game_id > 0)
        .distinct()
        .all()
    )
    return {row[0] for row in rows}


def _next_game_for_user(db: Session, user_id: int) -> Game | None:
    published = _published_games(db)
    if not published:
        return None
    completed = _completed_game_ids(db, user_id)
    for game in published:
        if game.id not in completed:
            return game
    return published[0]


def _session_to_out(session: GameSession) -> GameSessionOut:
    return GameSessionOut(
        game_id=session.game_id,
        categories=session.categories,
        team1=session.team1,
        team2=session.team2,
        score1=session.score1,
        score2=session.score2,
        turn=session.turn,
        answered=session.answered,
        results=session.results,
        used_power_ups=session.used_power_ups,
    )


@router.get("/published", response_model=list[GameOut])
def list_published(db: Session = Depends(get_db)):
    games = _published_games(db)
    result = []
    for g in games:
        out = GameOut.model_validate(g)
        out.question_count = len(g.questions)
        result.append(out)
    return result


@router.get("/questions/{question_id}/answer")
def get_answer(question_id: int, db: Session = Depends(get_db)):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="السؤال غير موجود")
    return {"answer": q.answer}


@router.get("/my/results", response_model=list[GameResultOut])
def my_results(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    results = (
        db.query(GameResult)
        .filter(GameResult.user_id == user.id)
        .order_by(GameResult.played_at.desc())
        .all()
    )
    return [GameResultOut.model_validate(r) for r in results]


@router.get("/my/entry", response_model=GameEntryOut)
def my_entry(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    published = _published_games(db)
    if not published:
        return GameEntryOut(action="none", total_games=0)

    completed = _completed_game_ids(db, user.id)
    game_index = {g.id: i + 1 for i, g in enumerate(published)}

    session = db.query(GameSession).filter(GameSession.user_id == user.id).first()
    if session:
        active_game = next((g for g in published if g.id == session.game_id), None)
        if active_game:
            return GameEntryOut(
                action="resume",
                game_id=active_game.id,
                game_title=active_game.title,
                game_number=game_index[active_game.id],
                total_games=len(published),
                completed_games=len(completed),
                session=_session_to_out(session),
            )
        db.delete(session)
        db.commit()

    next_game = _next_game_for_user(db, user.id)
    if not next_game:
        return GameEntryOut(action="none", total_games=len(published), completed_games=len(completed))

    all_completed = len(completed) >= len(published)
    return GameEntryOut(
        action="new",
        game_id=next_game.id,
        game_title=next_game.title,
        game_number=game_index[next_game.id],
        total_games=len(published),
        completed_games=len(completed),
        all_completed=all_completed,
    )


@router.put("/my/session", response_model=GameSessionOut)
def save_session(body: GameSessionSave, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    game = db.query(Game).filter(Game.id == body.game_id, Game.status == "published").first()
    if not game:
        raise HTTPException(status_code=404, detail="اللعبة غير موجودة")

    next_game = _next_game_for_user(db, user.id)
    session = db.query(GameSession).filter(GameSession.user_id == user.id).first()
    if session and session.game_id != body.game_id:
        if session.game_id not in _completed_game_ids(db, user.id):
            raise HTTPException(status_code=400, detail="لا يمكن بدء لعبة جديدة قبل إكمال أو استئناف اللعبة الحالية")
        db.delete(session)
        session = None

    if not session and next_game and body.game_id != next_game.id:
        raise HTTPException(status_code=400, detail="يجب إكمال الألعاب السابقة أولاً")

    if session:
        session.game_id = body.game_id
        session.categories = body.categories
        session.team1 = body.team1.strip()
        session.team2 = body.team2.strip()
        session.score1 = body.score1
        session.score2 = body.score2
        session.turn = body.turn
        session.answered = body.answered
        session.results = body.results
        session.used_power_ups = body.used_power_ups
    else:
        session = GameSession(
            user_id=user.id,
            game_id=body.game_id,
            categories=body.categories,
            team1=body.team1.strip(),
            team2=body.team2.strip(),
            score1=body.score1,
            score2=body.score2,
            turn=body.turn,
            answered=body.answered,
            results=body.results,
            used_power_ups=body.used_power_ups,
        )
        db.add(session)

    db.commit()
    db.refresh(session)
    return _session_to_out(session)


@router.delete("/my/session", status_code=204)
def clear_session(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    session = db.query(GameSession).filter(GameSession.user_id == user.id).first()
    if session:
        db.delete(session)
        db.commit()


@router.get("/{game_id}", response_model=GameDetailPublic)
def get_published_game(game_id: int, db: Session = Depends(get_db)):
    game = db.query(Game).filter(Game.id == game_id, Game.status == "published").first()
    if not game:
        raise HTTPException(status_code=404, detail="اللعبة غير موجودة")
    return GameDetailPublic.model_validate(game)


@router.post("/results", response_model=GameResultOut, status_code=201)
def save_result(body: GameResultCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if body.game_id <= 0:
        raise HTTPException(status_code=400, detail="معرّف اللعبة غير صالح")
    game = db.query(Game).filter(Game.id == body.game_id, Game.status == "published").first()
    if not game:
        raise HTTPException(status_code=404, detail="اللعبة غير موجودة")

    result = GameResult(
        game_id=body.game_id,
        user_id=user.id,
        team1=body.team1,
        team2=body.team2,
        score1=body.score1,
        score2=body.score2,
        winner=body.winner,
        categories=body.categories,
    )
    db.add(result)
    db.commit()
    db.refresh(result)

    session = db.query(GameSession).filter(GameSession.user_id == user.id, GameSession.game_id == body.game_id).first()
    if session:
        db.delete(session)
        db.commit()

    return GameResultOut.model_validate(result)
