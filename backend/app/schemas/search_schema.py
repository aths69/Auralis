from pydantic import BaseModel
from typing import Optional
class SearchUser(BaseModel):
    id : int
    username : str
    profile_pic : Optional[str] = None
