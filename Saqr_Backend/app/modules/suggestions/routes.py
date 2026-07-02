from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import require_admin
from app.core.security import get_current_user
from app.modules.auth.models import User
from app.modules.suggestions.models import CategorySuggestion
from app.modules.suggestions.schemas import SuggestionCreate, SuggestionOut

router = APIRouter(prefix="/api/suggestions", tags=["suggestions"])


@router.post("", response_model=SuggestionOut, status_code=201)
def create_suggestion(
    body: SuggestionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    suggestion = CategorySuggestion(user_id=user.id, text=body.text.strip())
    db.add(suggestion)
    db.commit()
    db.refresh(suggestion)
    return SuggestionOut.model_validate(suggestion)


@router.get("", response_model=list[SuggestionOut])
def list_suggestions(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    rows = (
        db.query(CategorySuggestion, User.name)
        .join(User, User.id == CategorySuggestion.user_id)
        .order_by(CategorySuggestion.created_at.desc())
        .all()
    )
    return [
        SuggestionOut(
            id=s.id,
            user_id=s.user_id,
            user_name=name,
            text=s.text,
            created_at=s.created_at,
        )
        for s, name in rows
    ]
