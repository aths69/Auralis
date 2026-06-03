from app.db.database import get_db
from app.schemas.notification_schema import NotificationsResponse,ReadNotification,UnReadResposnse
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.services.notification_sevices import get_all_notifications,update_read,count_unread_notifications
from app.core.jwt import get_current_user

noti_router = APIRouter(tags=['Notifications'],prefix="/notifications")

@noti_router.get("/",response_model=NotificationsResponse)
def get_notifications(db : Session = Depends(get_db),auth_user = Depends(get_current_user)):
    return get_all_notifications(db,auth_user)

@noti_router.patch("/{noti_id}/read",response_model=ReadNotification)
def read_update(noti_id : int,db : Session = Depends(get_db),auth_user = Depends(get_current_user)):
    return update_read(noti_id,db,auth_user)

@noti_router.get("/unread-count",response_model=UnReadResposnse)
def get_unread_count(db : Session = Depends(get_db),auth_user = Depends(get_current_user)):
    return count_unread_notifications(db,auth_user)
