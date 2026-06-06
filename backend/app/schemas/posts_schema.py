from pydantic import BaseModel
from datetime import datetime
from typing  import Optional

class PostSchema(BaseModel):

    captions : Optional[str] = None
    image_url : Optional[str] = None

class UpdatePost(BaseModel):
    captions : Optional[str] = None
    image_url : Optional[str] = None

class UserForPost(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class PostResponse(BaseModel):
    id : int
    content: str
    captions : Optional[str] = None
    image_url : Optional[str] = None
    created_at : datetime
    like_count : int
    comment_count : int
    liked_by_me: Optional[bool] = False
    user: UserForPost

class CreateAndUpdateResponse(BaseModel):
    id : int
    captions : Optional[str] = None
    image_url : Optional[str] = None
    owner_id : int
    created_at : datetime
