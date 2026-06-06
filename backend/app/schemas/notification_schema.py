from pydantic import BaseModel
from datetime import datetime
from typing import List


from typing import Optional

class Actor(BaseModel):
    id: str
    username: str
    avatar_url: Optional[str] = None

class NotificationResponse(BaseModel):
    id: int
    type: str = "notification"
    message: str
    read: bool
    created_at: datetime
    actor: Optional[Actor] = None

class NotificationsResponse(BaseModel):
    notifications : List[NotificationResponse]

class ReadNotification(BaseModel):
    message : str

class UnReadResposnse(BaseModel):
    count : int
