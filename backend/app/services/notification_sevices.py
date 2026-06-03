from fastapi import HTTPException
from app.db.models import NotificationModel

def get_all_notifications(db,auth_user):

    notifications = db.query(NotificationModel).filter(NotificationModel.receiver_id == auth_user.id).order_by(NotificationModel.created_at.desc()).all()

    return {
        "notifications": [
            {
                "id": notification.id,
                "sender_id": notification.sender_user.id,
                "sender_username": notification.sender_user.username,
                "sender_profile_pic": notification.sender_user.profile_pic,
                "message": notification.message,
                "post_id": notification.post_id,
                "is_read": notification.is_read,
                "created_at": notification.created_at
            }
            for notification in notifications
        ]
    }

def update_read(noti_id,db,auth_user):

    notification = db.query(NotificationModel).filter(NotificationModel.id == noti_id).first()

    if not notification:
        raise HTTPException(status_code=404,detail="Notification not found")

    if notification.receiver_id != auth_user.id:
        raise HTTPException(status_code=403,detail="Not authorized")

    notification.is_read = True
    db.commit()
    db.refresh(notification)

    return {"message": "Notification marked as read"}

def count_unread_notifications(db,auth_user):

     unread_count = db.query(NotificationModel).filter(NotificationModel.receiver_id == auth_user.id,NotificationModel.is_read.is_(False)).count()

     return {"unread_count" : unread_count }
