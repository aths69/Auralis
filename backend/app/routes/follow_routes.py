from app.db.database import get_db
from app.schemas.follow_schema import FollowResponse,FollowUser
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.services.follow_services import follow,unfollow,get_followers,get_following
from app.core.jwt import get_current_user
from typing import List

follow_router = APIRouter(tags=['Follow Service'],prefix="/follow")

@follow_router.post("/{user_id}",response_model=FollowResponse)
def follow_user(user_id : int,db : Session = Depends(get_db),auth_user = Depends(get_current_user)):
    return follow(user_id,db,auth_user)

@follow_router.delete("/{user_id}",response_model=FollowResponse)
def unfollow_user(user_id : int,db : Session = Depends(get_db),auth_user = Depends(get_current_user)):
    return unfollow(user_id,db,auth_user)

@follow_router.get("/followers/{user_id}",response_model=List[FollowUser])
def follower_list(user_id : int,db : Session = Depends(get_db)):
    return get_followers(user_id,db)

@follow_router.get("/following/{user_id}",response_model=List[FollowUser])
def following_list(user_id : int,db : Session = Depends(get_db)):
    return get_following(user_id,db)
