from fastapi.param_functions import Query
from typing import List
from app.db.database import get_db
from app.schemas.comment_schema import Comment,CommentResponse,DeleteCommentResponse
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.services.comment_services import add_comment,all_comments,delete_comment
from app.core.jwt import get_current_user


comment_router = APIRouter(tags=['Comments'])

@comment_router.get("/posts/{post_id}/comments",response_model=List[CommentResponse])
def allcomments(post_id : int,db : Session = Depends(get_db),limit : int = Query(default=10,ge=1,le=50),offset : int = Query(default = 0,ge = 0)):
    return all_comments(post_id,db,limit,offset)

@comment_router.post("/posts/{post_id}/comments",response_model=CommentResponse)
def new_comment(comment : Comment,post_id : int,db : Session = Depends(get_db),auth_user = Depends(get_current_user)):
    return add_comment(post_id,db,auth_user,comment)

@comment_router.delete("/posts/{post_id}/comments/{comment_id}",response_model=DeleteCommentResponse)
def comment_delete(comment_id : int,post_id : int,db : Session = Depends(get_db),auth_user = Depends(get_current_user)):
    return delete_comment(post_id,comment_id,db,auth_user)
