from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.db import models
from app.routes.user_routes import user_router
from app.routes.profile_routes import profile_router
from app.routes.post_routes import post_router
from app.routes.like_routes import like_router
from app.routes.comment_routes import comment_router
from app.routes.follow_routes import follow_router
from app.routes.search_routes import search_router
from app.routes.notification_routes import noti_router
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

origins = ["http://localhost:8080"]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads",StaticFiles(directory="app/uploads"),name="uploads")
app.include_router(user_router)
app.include_router(profile_router)
app.include_router(post_router)
app.include_router(like_router)
app.include_router(comment_router)
app.include_router(follow_router)
app.include_router(search_router)
app.include_router(noti_router)
