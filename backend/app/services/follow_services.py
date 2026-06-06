from app.db.models import FollowModel,UsersModel,NotificationModel
from fastapi import HTTPException

def follow(user_id,db,auth_user):

    existing_user = db.query(UsersModel).filter(UsersModel.id == user_id).first()

    if not existing_user:
        raise HTTPException(status_code=404,detail="User not found")

    if auth_user.id == user_id:
        raise HTTPException(status_code=400,detail="You cannot follow yourself")

    existing_follow = db.query(FollowModel).filter(FollowModel.follower_id == auth_user.id,FollowModel.following_id == user_id).first()

    if existing_follow:
        raise HTTPException(status_code=400,detail="Already following this user")

    add_follow = FollowModel(follower_id = auth_user.id,following_id = user_id )

    db.add(add_follow)

    notification = NotificationModel(sender_id=auth_user.id,
                                    receiver_id=user_id,
                                    message = f"{auth_user.username} started following you",)

    db.add(notification)
    db.commit()
    return {"message" : "Followed Successfully"}

def unfollow(user_id,db,auth_user):

     existing_user = db.query(UsersModel).filter(UsersModel.id == user_id).first()

     if not existing_user:
         raise HTTPException(status_code=404,detail="User not found")

     if auth_user.id == user_id:
        raise HTTPException(status_code=400,detail="Invalid operation")

     existing_follow = db.query(FollowModel).filter(FollowModel.follower_id == auth_user.id,FollowModel.following_id == user_id).first()

     if not existing_follow:
          raise HTTPException(status_code=400,detail="You are not following the user")

     db.delete(existing_follow)
     db.commit()
     return {"message" : "Unfollowed successfully"}

def get_follow_stats(user_id,db):

     existing_user = db.query(UsersModel).filter(UsersModel.id == user_id).first()

     if not existing_user:
         raise HTTPException(status_code=404,detail="User not found")

     followers_count = db.query(FollowModel).filter(FollowModel.following_id == user_id ).count()
     following_count = db.query(FollowModel).filter(FollowModel.follower_id == user_id).count()

     return{"followers" : followers_count,
         "following" : following_count}

def get_followers(user_id, db):

    existing_user = db.query(UsersModel).filter(UsersModel.id == user_id).first()

    if not existing_user:
        raise HTTPException(status_code=404,detail="User not found")

    followers = db.query(UsersModel).join(FollowModel,FollowModel.follower_id == UsersModel.id).filter(FollowModel.following_id == user_id).all()

    return [{"id": f.id, "username": f.username, "avatar_url": f.profile_pic} for f in followers]

def get_following(user_id, db):

    existing_user = db.query(UsersModel).filter(UsersModel.id == user_id).first()

    if not existing_user:
        raise HTTPException(status_code=404,detail="User not found")

    following = db.query(UsersModel).join(FollowModel,FollowModel.following_id == UsersModel.id).filter(FollowModel.follower_id == user_id).all()

    return [{"id": f.id, "username": f.username, "avatar_url": f.profile_pic} for f in following]
