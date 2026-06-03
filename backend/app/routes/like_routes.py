from app.db.database import get_db
from app.schemas.like_schema import LikeSchema
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.services.like_services import like_post,unlike_post
from app.core.jwt import get_current_user



like_router = APIRouter(tags=['Likes'])

@like_router.post("/posts/{post_id}/likes",response_model=LikeSchema)
def post_like(post_id : int,db : Session = Depends(get_db),auth_user = Depends(get_current_user)):
    return like_post(post_id,db,auth_user)

@like_router.delete("/posts/{post_id}/likes",response_model=LikeSchema)
def post_unlike(post_id : int,db : Session = Depends(get_db),auth_user = Depends(get_current_user)):
    return unlike_post(post_id,db,auth_user)
