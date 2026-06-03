from pydantic import BaseModel
from datetime import datetime
from typing import List


class NotificationResponse(BaseModel):
    id: int
    sender_id: int
    sender_username: str
    sender_profile_pic: str
    message: str
    post_id: int | None
    is_read: bool
    created_at: datetime

class NotificationsResponse(BaseModel):
    notifications : List[NotificationResponse]

class ReadNotification(BaseModel):
    message : str

class UnReadResposnse(BaseModel):
    unread_count : int
