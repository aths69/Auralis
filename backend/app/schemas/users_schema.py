from pydantic import BaseModel,field_validator,Field
from pydantic.networks import EmailStr
from typing import Optional

class UsersSchema(BaseModel):
    email : EmailStr
    password : str
    username: str = Field(min_length=3,max_length=20)
    bio : Optional[str] = None
    profile_pic : Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password(cls,value):

        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters ")

        if value.lower() == value:
            raise ValueError("Password must contain uppercase letter")

        if value.upper() == value:
            raise ValueError("Password must contain lowercase letter")

        if not any(char.isdigit() for char in value):
            raise ValueError("Password must contain numbers")
        return value

    @field_validator("bio")
    @classmethod
    def validate_bio(cls, value):
        if value is None:
            return value

        words = value.split()
        if len(words) > 20:
            raise ValueError("Bio cannot exceed 20 words")
        return value

class UsersResponse(BaseModel):
    id : int
    email : EmailStr
    username : str
    bio : Optional[str] = None
    profile_pic : Optional[str] = None

class UserLogin(BaseModel):
    email : str
    password : str

class TokenResponse(BaseModel):
    access_token : str
    token_type : str

class VerifyEmailResponse(BaseModel):
    message : str
