from pydantic import BaseModel
from typing import Optional
class SearchUser(BaseModel):
    id : int
    username : str
    avatar_url : Optional[str] = None
    followers_count: int = 0
