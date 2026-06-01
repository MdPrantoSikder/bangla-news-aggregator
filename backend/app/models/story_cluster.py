from datetime import datetime
from sqlalchemy import Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base


class StoryCluster(Base):
    __tablename__ = "story_clusters"
    id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    article_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    articles: Mapped[list["Article"]] = relationship(back_populates="story_cluster")
