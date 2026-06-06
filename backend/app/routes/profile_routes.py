from app.db.database import get_db
from app.schemas.profile_schema import UserProfile,UpdateBio,UpdateUsername,UpdatePassword,ProfilePicResponse,BioUpdateResponse,UsernameUpdateResponse,PasswordUpdateResponse,PublicProfile
from fastapi import APIRouter, Depends,File,UploadFile
from sqlalchemy.orm import Session
from app.services.profile_services import profile,update_profile_pic,update_bio,update_username,update_password,public_profile
from app.core.jwt import get_current_user


profile_router = APIRouter(
    tags=["Profile"],
    prefix="/profile"
)
@profile_router.get("/",response_model=UserProfile)
def user_profile(db : Session = Depends(get_db),auth_user = Depends(get_current_user)):
    return profile(db,auth_user)

@profile_router.get("/{user_id}",response_model=PublicProfile)
def get_public_profile(user_id : int,db : Session = Depends(get_db), auth_user = Depends(get_current_user)):
    return public_profile(user_id,db, current_user_id=auth_user.id if auth_user else None)

@profile_router.patch("/picture",response_model = ProfilePicResponse)
def pp_update(image : UploadFile = File() ,db : Session = Depends(get_db),auth_user = Depends(get_current_user)):
    return update_profile_pic(image,db,auth_user)

@profile_router.patch("/bio",response_model=BioUpdateResponse)
def bio_update(request: UpdateBio,db : Session = Depends(get_db),auth_user = Depends(get_current_user)):
    return update_bio(request,db,auth_user)

@profile_router.patch("/username",response_model=UsernameUpdateResponse)
def username_update(request : UpdateUsername,db : Session = Depends(get_db),auth_user = Depends(get_current_user)):
    return update_username(request,db,auth_user)

@profile_router.patch("/password",response_model=PasswordUpdateResponse)
def password_update(request : UpdatePassword,db : Session = Depends(get_db),auth_user = Depends(get_current_user)):
    return update_password(request,db,auth_user)
