from app.db.models import PostModel,CommentsModel,NotificationModel
from fastapi import HTTPException

def all_comments(post_id,db,limit,offset):
    post = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404,detail="Post not found")

    comments = db.query(CommentsModel).filter(CommentsModel.post_id == post_id).order_by(CommentsModel.created_at.asc()).limit(limit).offset(offset).all()
    return comments


def add_comment(post_id,db,auth_user,comment):

    post = db.query(PostModel).filter(PostModel.id == post_id).first()

    if not post:
        raise HTTPException(status_code=404,detail="Post not found")

    new_comment = CommentsModel(comment = comment.comment,user_id = auth_user.id,post_id = post_id)

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

    return new_comment

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
