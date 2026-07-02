from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import require_admin
from app.modules.auth.models import User
from app.modules.games.models import Game, Question
from app.modules.games.schemas import (
    GameCreate, GameOut, GameDetail,
    QuestionCreate, QuestionUpdate, QuestionOut,
)

router = APIRouter(prefix="/api/admin/games", tags=["admin-games"])


@router.get("", response_model=list[GameOut])
def list_games(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    games = db.query(Game).order_by(Game.id.asc()).all()
    result = []
    for g in games:
        out = GameOut.model_validate(g)
        out.question_count = len(g.questions)
        result.append(out)
    return result


@router.post("", response_model=GameOut, status_code=201)
def create_game(body: GameCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    game = Game(title=body.title.strip(), created_by=admin.id)
    db.add(game)
    db.commit()
    db.refresh(game)
    return GameOut.model_validate(game)


@router.get("/{game_id}", response_model=GameDetail)
def get_game(game_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="اللعبة غير موجودة")
    return GameDetail.model_validate(game)


@router.delete("/{game_id}", status_code=204)
def delete_game(game_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="اللعبة غير موجودة")
    db.delete(game)
    db.commit()


@router.post("/{game_id}/publish", response_model=GameOut)
def publish_game(game_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="اللعبة غير موجودة")
    q_count = len(game.questions)
    if q_count == 0:
        raise HTTPException(status_code=400, detail="أضف أسئلة قبل النشر")
    if q_count < 72:
        raise HTTPException(status_code=400, detail=f"يجب إضافة ٧٢ سؤال على الأقل (الحالي: {q_count})")
    game.status = "published"
    db.commit()
    db.refresh(game)
    out = GameOut.model_validate(game)
    out.question_count = len(game.questions)
    return out


@router.post("/{game_id}/unpublish", response_model=GameOut)
def unpublish_game(game_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="اللعبة غير موجودة")
    game.status = "draft"
    db.commit()
    db.refresh(game)
    out = GameOut.model_validate(game)
    out.question_count = len(game.questions)
    return out


# ── Bulk upload ──

@router.post("/{game_id}/questions/bulk", response_model=list[QuestionOut], status_code=201)
def bulk_upload(game_id: int, body: list[QuestionCreate], db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="اللعبة غير موجودة")
    if game.status == "published":
        raise HTTPException(status_code=400, detail="لا يمكن التعديل على لعبة منشورة")
    created = []
    for item in body:
        q = Question(
            game_id=game_id,
            category_id=item.category_id,
            points=item.points,
            text=item.text.strip(),
            answer=item.answer.strip(),
            options=item.options,
        )
        db.add(q)
        created.append(q)
    db.commit()
    for q in created:
        db.refresh(q)
    return [QuestionOut.model_validate(q) for q in created]


# ── Questions ──

@router.post("/{game_id}/questions", response_model=QuestionOut, status_code=201)
def add_question(game_id: int, body: QuestionCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="اللعبة غير موجودة")
    if game.status == "published":
        raise HTTPException(status_code=400, detail="لا يمكن التعديل على لعبة منشورة")
    q = Question(
        game_id=game_id,
        category_id=body.category_id,
        points=body.points,
        text=body.text.strip(),
        answer=body.answer.strip(),
        options=body.options,
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return QuestionOut.model_validate(q)


@router.put("/{game_id}/questions/{question_id}", response_model=QuestionOut)
def update_question(game_id: int, question_id: int, body: QuestionUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    q = db.query(Question).filter(Question.id == question_id, Question.game_id == game_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="السؤال غير موجود")
    game = db.query(Game).filter(Game.id == game_id).first()
    if game and game.status == "published":
        raise HTTPException(status_code=400, detail="لا يمكن التعديل على لعبة منشورة")
    if body.text is not None:
        q.text = body.text.strip()
    if body.answer is not None:
        q.answer = body.answer.strip()
    if body.options is not None:
        q.options = body.options
    db.commit()
    db.refresh(q)
    return QuestionOut.model_validate(q)


@router.delete("/{game_id}/questions/{question_id}", status_code=204)
def delete_question(game_id: int, question_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    q = db.query(Question).filter(Question.id == question_id, Question.game_id == game_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="السؤال غير موجود")
    game = db.query(Game).filter(Game.id == game_id).first()
    if game and game.status == "published":
        raise HTTPException(status_code=400, detail="لا يمكن التعديل على لعبة منشورة")
    db.delete(q)
    db.commit()
