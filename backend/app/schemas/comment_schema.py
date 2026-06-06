from pydantic import BaseModel

from datetime import datetime
from typing import Optional

class Comment(BaseModel):
    content : str

class UserForComment(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class CommentResponse(BaseModel):
    id: int
    content: str
    created_at: datetime
    user: UserForComment

class DeleteCommentResponse(BaseModel):
    message : str
