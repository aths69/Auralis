from pydantic import BaseModel,field_validator,Field
from typing import Optional,List

class UserProfile(BaseModel):
    id : int
    profile_pic : Optional[str] = None
    username : str
    bio : str
    followers : int
    following : int

class UpdateProfilePic(BaseModel):
    profile_pic : str

class UpdateBio(BaseModel):
    bio : str
    @field_validator("bio")
    @classmethod
    def validate_bio(cls, value):
        words = value.split()
        if len(words) > 20:
            raise ValueError("Bio cannot exceed 20 words")
        return value

class UpdateUsername(BaseModel):
    username: str = Field(min_length=3,max_length=20)

class UpdatePassword(BaseModel):
    current_password : str
    new_password: str = Field(min_length=6,max_length=50)

class ProfilePicResponse(BaseModel):
    profile_pic : str

class BioUpdateResponse(BaseModel):
    bio : str

class UsernameUpdateResponse(BaseModel):
    username : str

class PasswordUpdateResponse(BaseModel):
   message : str

class PostPreview(BaseModel):
    id: int
    image_url: str

class PublicProfile(BaseModel):
    id : int
    profile_pic : str
    username : str
    bio : str
    followers : int
    following : int
    posts : List[PostPreview]
