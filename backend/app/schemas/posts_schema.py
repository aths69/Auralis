from pydantic import BaseModel
from datetime import datetime
from typing  import Optional

class PostSchema(BaseModel):

    captions : Optional[str]
    image_url : str

class UpdatePost(BaseModel):
    captions : Optional[str]
    image_url : str

class PostResponse(BaseModel):

    id : int
    captions : Optional[str]
    image_url : str
    owner_id : int
    created_at : datetime
    likes_count : int
    comments_count : int

class CreateAndUpdateResponse(BaseModel):
    id : int
    captions : Optional[str]
    image_url : str
    owner_id : int
    created_at : datetime
