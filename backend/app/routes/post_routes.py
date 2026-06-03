from app.db.database import get_db
from app.schemas.posts_schema import PostResponse,CreateAndUpdateResponse
from fastapi import APIRouter, Depends,Query,File,Form,UploadFile
from sqlalchemy.orm import Session
from app.services.post_services import create_post,update_post,delete_post,delete_all,get_feed,get_user_posts
from app.core.jwt import get_current_user
from typing import List,Optional

post_router = APIRouter(tags=['Posts'],prefix="/posts")

@post_router.get("/feed",response_model=List[PostResponse])
def feed(db : Session = Depends(get_db),limit : int = Query(default=10,ge=1,le=50),offset : int = Query(default=0,ge = 0)):
    return get_feed(db,limit,offset)

@post_router.get("/user/{user_id}",response_model=List[PostResponse])
def user_posts(user_id : int,db : Session = Depends(get_db),limit : int = Query(default=10,ge=1,le=50),offset : int = Query(default=0,ge = 0)):
    return get_user_posts(user_id,db,limit,offset)

@post_router.post("/create",response_model=CreateAndUpdateResponse)
def post_create(image : UploadFile = File(),captions : Optional[str] = Form(None),db : Session = Depends(get_db),auth_user = Depends(get_current_user)):
    return create_post(image,captions,db,auth_user)

@post_router.patch("/update/{post_id}",response_model=CreateAndUpdateResponse)
def post_update(post_id : int,image : Optional[UploadFile] = File(None),captions : Optional[str] = Form(None),db : Session = Depends(get_db),auth_user = Depends(get_current_user)):
    return update_post(post_id,image,captions,db,auth_user)

@post_router.delete("/deleteAll")
def all_delete(db : Session = Depends(get_db),auth_user = Depends(get_current_user)):
    return delete_all(db,auth_user)

@post_router.delete("/delete/{post_id}")
def post_delete(post_id :int,db : Session = Depends(get_db),auth_user = Depends(get_current_user)):
    return delete_post(post_id,db,auth_user)
