# Import all models here so SQLAlchemy's registry sees them when
# anything imports from app.models.
# This fixes the "failed to locate a name 'Article'" error
# when models reference each other via relationship() strings.
from app.models.source import Source
from app.models.article import Article