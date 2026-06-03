from pydantic import BaseModel

class FollowResponse(BaseModel):
    message : str

class FollowUser(BaseModel):
    id: int
    username: str
    profile_pic: str | None = None

    class Config:
        from_attributes = True
