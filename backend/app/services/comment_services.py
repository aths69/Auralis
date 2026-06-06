from app.db.models import PostModel,CommentsModel,NotificationModel
from fastapi import HTTPException

def all_comments(post_id,db,limit,offset):
    post = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404,detail="Post not found")

    comments = db.query(CommentsModel).filter(CommentsModel.post_id == post_id).order_by(CommentsModel.created_at.asc()).limit(limit).offset(offset).all()
    
    result = []
    for c in comments:
        result.append({
            "id": c.id,
            "content": c.comment,
            "created_at": c.created_at,
            "user": {
                "id": c.user.id,
                "username": c.user.username,
                "email": c.user.email,
                "bio": c.user.bio,
                "avatar_url": c.user.profile_pic
            }
        })
    return result


def add_comment(post_id,db,auth_user,comment):

    post = db.query(PostModel).filter(PostModel.id == post_id).first()

    if not post:
        raise HTTPException(status_code=404,detail="Post not found")

    new_comment = CommentsModel(comment = comment.content,user_id = auth_user.id,post_id = post_id)

    db.add(new_comment)
    if post.owner_id != auth_user.id:
        notification = NotificationModel(
            sender_id=auth_user.id,
            receiver_id=post.owner_id,
            message=f"{auth_user.username} commented on your post",
            post_id=post_id
        )

        db.add(notification)
    db.commit()
    db.refresh(new_comment)

    return {
        "id": new_comment.id,
        "content": new_comment.comment,
        "created_at": new_comment.created_at,
        "user": {
            "id": auth_user.id,
            "username": auth_user.username,
            "email": auth_user.email,
            "bio": auth_user.bio,
            "avatar_url": auth_user.profile_pic
        }
    }

def delete_comment(post_id,comment_id,db,auth_user):
    post = db.query(PostModel).filter(PostModel.id == post_id).first()

    if not post:
        raise HTTPException(status_code=404,detail="Post not found")


    comment = db.query(CommentsModel).filter(CommentsModel.id == comment_id,CommentsModel.post_id == post_id).first()

    if not comment:
        raise HTTPException(status_code=404,detail="Comment not found")

    if auth_user.id != comment.user_id:
        raise HTTPException(status_code=403,detail="Not authorized")

    db.delete(comment)
    db.commit()
    return {"message" : "Comment deleted successfully"}
