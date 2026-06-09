from app.db.database import get_db
from app.schemas.users_schema import UsersResponse,TokenResponse,VerifyEmailResponse
from fastapi import APIRouter, Depends,Form,File,UploadFile, BackgroundTasks
from sqlalchemy.orm import Session
from app.services.user_services import signup,login,verify_email
from fastapi.security import OAuth2PasswordRequestForm
from typing import Optional


user_router = APIRouter(tags=["Authentication"])


@user_router.post("/signup",response_model=UsersResponse)
def signup_user(
    background_tasks: BackgroundTasks,
    email: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    bio: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)):

    return signup(db,
            email,
            username,
            password,
            bio,
            image,
            background_tasks)

@user_router.post("/login",response_model=TokenResponse)
def login_user(request : OAuth2PasswordRequestForm = Depends(),db : Session = Depends(get_db)):
    return login(db,request)

@user_router.get("/verify-email",response_model=VerifyEmailResponse)
def verifyEmail(token : str,db : Session = Depends(get_db)):
    return verify_email(db,token)
