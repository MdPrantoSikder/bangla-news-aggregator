# Import the FastAPI class from the fastapi package.
# This is the main building block we'll use to create our web app.
from fastapi import FastAPI
from app.routers import sources as sources_router
from app.routers import articles as articles_router
# Create an instance of the FastAPI class.
# "app" is just a variable name — it could be anything, but "app" is the convention.
# This object represents our web application.
app = FastAPI()
app.include_router(sources_router.router)
app.include_router(articles_router.router)
# This is a "decorator" — it tells FastAPI:
# "When someone sends a GET request to the URL '/', run the function below."
# The "/" is the root URL of your site (like http://localhost:8000/).
@app.get("/")
def read_root():
    # Whatever this function returns becomes the response sent to the user.
    # FastAPI automatically converts this dictionary into JSON.
    return {"message": "Hello, World! Bangla News Aggregator backend is alive."}

@app.get("/health")
def health_check():
    return {"status": "ok"}