from datetime import datetime

from pydantic import BaseModel, Field


class SuggestionCreate(BaseModel):
    text: str = Field(min_length=2, max_length=200)


class SuggestionOut(BaseModel):
    id: int
    user_id: int
    user_name: str | None = None
    text: str
    created_at: datetime | None = None

    class Config:
        from_attributes = True
