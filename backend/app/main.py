"""Main FastAPI app entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import sources  as sources_router
from app.routers import articles as articles_router
from app.routers import search   as search_router
from app.routers import stories  as stories_router
from app.routers import auth     as auth_router
from app.routers import admin    as admin_router


app = FastAPI(title="BanglaBrief API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router.router)
app.include_router(admin_router.router)
app.include_router(sources_router.router)
app.include_router(articles_router.router)
app.include_router(search_router.router)
app.include_router(stories_router.router)


@app.get("/")
def read_root():
    return {"message": "BanglaBrief backend is alive."}


@app.get("/health")
def health_check():
    return {"status": "ok"}
