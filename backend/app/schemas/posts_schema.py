from pydantic import BaseModel
from datetime import datetime
from typing  import Optional

class PostSchema(BaseModel):

    captions : Optional[str] = None
    image_url : Optional[str] = None

class UpdatePost(BaseModel):
    captions : Optional[str] = None
    image_url : Optional[str] = None

class PostResponse(BaseModel):

    id : int
    captions : Optional[str] = None
    image_url : Optional[str] = None
    owner_id : int
    created_at : datetime
    likes_count : int
    comments_count : int

class CreateAndUpdateResponse(BaseModel):
    id : int
    captions : Optional[str] = None
    image_url : Optional[str] = None
    owner_id : int
    created_at : datetime
