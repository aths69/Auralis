from app.core.security import hash_password, verify_password
from app.db.models import UsersModel
from fastapi import HTTPException,Depends
from app.core.jwt import jwt_service
from fastapi.security import OAuth2PasswordRequestForm
from app.core.email import send_verification_email
from pathlib import Path
import uuid
import secrets

def signup(db, email,username,password,bio,image):

     existing_user = db.query(UsersModel).filter(UsersModel.email == email).first()

     if existing_user:
        raise HTTPException(status_code=400,detail="User already registered")

     existing_username = db.query(UsersModel).filter(UsersModel.username == username).first()

     if existing_username:
        raise HTTPException(status_code=400,detail="Username already exists")

     image_url = None

     if image:
        if not image.content_type or not image.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="Only image files are allowed"
            )

        extension = Path(image.filename).suffix.lower()
        filename = f"{uuid.uuid4()}{extension}"

        upload_dir = Path("app/uploads/profile_pics")
        upload_dir.mkdir(parents=True,exist_ok=True)

        file_path = upload_dir / filename

        with file_path.open("wb") as buffer:
            buffer.write(image.file.read())

        image_url = f"/uploads/profile_pics/{filename}"

     hashed_pass = hash_password(password)
     verification_token = secrets.token_urlsafe(32)

     new_user = UsersModel(
             email=email,
             password=hashed_pass,
             username=username,
             bio=bio,
             profile_pic=image_url,
             verification_token = verification_token,
             is_verified = False
         )

     db.add(new_user)
     db.commit()
     db.refresh(new_user)

     send_verification_email(new_user.email,verification_token)

     return new_user


def login(db, request: OAuth2PasswordRequestForm = Depends()):

     existing_user = (
         db.query(UsersModel).filter(UsersModel.email == request.username).first()
     )
     if not existing_user:
         raise HTTPException(status_code=404, detail="Invalid Credentials")

     check_pass = verify_password(request.password,existing_user.password)

     if not check_pass:
         raise HTTPException(status_code=404, detail="Invalid Credentials")

     token = jwt_service.encode(existing_user.email)
     return {"access_token" : token,"token_type" : "bearer"}

def verify_email(db,token):

    user = db.query(UsersModel).filter(UsersModel.verification_token == token).first()

    if not user:
        raise HTTPException(status_code=400,detail="Invalid or expired verification token")

    user.verification_token = None
    user.is_verifed = True

    db.commit()
    db.refresh(user)
    return {"message" : "Verification Successfully"}
