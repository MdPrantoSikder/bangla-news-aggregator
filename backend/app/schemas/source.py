# BaseModel is Pydantic's base class for data validation models.
# All our schemas inherit from it.
from pydantic import BaseModel, ConfigDict

# datetime for the created_at timestamp.
from datetime import datetime


# Schema for incoming data when CREATING a new source.
# Notice: no 'id' field (database generates it), no 'created_at' (server sets it).
# Only the fields the client should provide.
class SourceCreate(BaseModel):
    name: str
    base_url: str
    language: str


# Schema for outgoing data — what the API RESPONDS with.
# This includes 'id' and 'created_at' because the server fills these in.
class SourceRead(BaseModel):
    id: int
    name: str
    base_url: str
    language: str
    created_at: datetime

    # Tell Pydantic this schema can be built from an ORM object (like our SQLAlchemy
    # Source model). Without this, Pydantic only accepts dicts.
    # In Pydantic v2 this is the way; older tutorials may show orm_mode=True (v1 syntax).
    model_config = ConfigDict(from_attributes=True)