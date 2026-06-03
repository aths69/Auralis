from app.db.database import get_db
from fastapi import APIRouter, Depends,Query
from sqlalchemy.orm import Session
from app.services.search_services import search_user
from app.schemas.search_schema import SearchUser
from typing import List

search_router = APIRouter(tags=['Search'],
                         prefix="/search")

@search_router.get("/users",response_model=List[SearchUser])
def user_search(db : Session = Depends(get_db),q : str = Query(...,min_length=1,max_length=30),limit: int = Query(default=20,ge = 1,le=50)):
    return search_user(q,limit,db)
