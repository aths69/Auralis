from app.db.models import PostModel,LikesModel,NotificationModel
from fastapi import HTTPException


def like_post(post_id,db,auth_user):

    post = db.query(PostModel).filter(PostModel.id == post_id).first()

    if not post:
        raise HTTPException(status_code=404,detail="Post not found")

    existing_like = db.query(LikesModel).filter(LikesModel.user_id == auth_user.id,LikesModel.post_id == post_id).first()

    if existing_like:
       raise HTTPException(status_code=400,detail = "Post already liked")

    new_like = LikesModel(user_id = auth_user.id,post_id = post_id)

    db.add(new_like)
    if post.owner_id != auth_user.id:
        notification = NotificationModel(sender_id=auth_user.id,
                                        receiver_id=post.owner_id,
                                        message = f"{auth_user.username} liked your post",
                                        post_id = post_id)

        db.add(notification)

    db.commit()
    db.refresh(new_like)

    return {"message" : "Post Liked"}

def unlike_post(post_id,db,auth_user):


    post = db.query(PostModel).filter(PostModel.id == post_id).first()

    if not post:
        raise HTTPException(status_code=404,detail="Post not found")

    existing_like = db.query(LikesModel).filter(LikesModel.user_id == auth_user.id,LikesModel.post_id == post_id).first()

    if not existing_like:
       raise HTTPException(status_code=404,detail = "Post not liked")

    db.delete(existing_like)
    db.commit()
    return {"message" : "Post unliked"}
