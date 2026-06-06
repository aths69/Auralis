from jose import jwt,JWTError
from datetime import datetime,timedelta,timezone
import os
from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.database import get_db
from fastapi import Depends,HTTPException
from app.db.models import UsersModel

load_dotenv()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

SECRET = os.getenv("SECRET") or ""
ALGORITHM = os.getenv("ALGORITHM") or ""
EXPIRE_TIME_IN_MINUTES_RAW = os.getenv("EXPIRE_TIME_IN_MINUTES")


if not SECRET :
    raise RuntimeError("SECRET is not set in environment")

if not ALGORITHM :
     raise RuntimeError("ALGORITHM is not set in environment")

if not EXPIRE_TIME_IN_MINUTES_RAW :
     raise RuntimeError("EXPIRE_TIME_IN_MINUTES is not set in environment")

EXPIRE_TIME_IN_MINUTES = int(EXPIRE_TIME_IN_MINUTES_RAW)

class JWTSERVICE:

    def encode(self,email : str)->str:

        expire = datetime.now(timezone.utc) +timedelta(
                    minutes=EXPIRE_TIME_IN_MINUTES
                )

        data = {"sub" : email, "exp" : expire}

        return jwt.encode(data,SECRET,algorithm=ALGORITHM)

    def decode(self,token : str):
        try:
           return jwt.decode(token,SECRET,algorithms=[ALGORITHM])
        except JWTError as ex:
            pass
        return None

    def create_email_verification_token(self,email : str) -> str:
        expire = datetime.now(timezone.utc)+timedelta(minutes=EXPIRE_TIME_IN_MINUTES)
        data = {"sub" : email,
                "purpose" : "email_verification",
                "exp" : expire}

        return jwt.encode(data,SECRET,algorithm=ALGORITHM)

    def decode_email_verification_token(self,token : str):
        try:
            payload = jwt.decode(token,SECRET,algorithms=[ALGORITHM])
            if payload.get("purpose") != "email_verification":
                return None
            return payload
        except JWTError:
            return None



jwt_service = JWTSERVICE()
def get_current_user(token : str = Depends(oauth2_scheme), db : Session = Depends(get_db) ):

    payload = jwt_service.decode(token)

    if payload is None:
        raise HTTPException(status_code=401,detail="Invalid token")

    email = payload.get("sub")

    if email is None:
         raise HTTPException(status_code=401,detail="Invalid token")

    user = db.query(UsersModel).filter(UsersModel.email == email).first()

    if not user :
         raise HTTPException(status_code=401,detail="Invalid token")

    return user
