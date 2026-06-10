from app.core.security import hash_password, verify_password
from app.db.models import UsersModel,PostModel,FollowModel
from app.schemas.profile_schema import UpdateBio,UpdateUsername,UpdatePassword
from app.services.follow_services import get_follow_stats
from fastapi import HTTPException
from pathlib import Path
import uuid
import cloudinary.uploader


def profile(db,auth_user):
   stats = get_follow_stats(auth_user.id,db)
   posts_count = db.query(PostModel).filter(PostModel.owner_id == auth_user.id).count()

   return {"id": auth_user.id,
           "email": auth_user.email,
           "username": auth_user.username,
           "bio": auth_user.bio,
           "avatar_url": auth_user.profile_pic,
           "followers_count": stats["followers"],
           "following_count": stats["following"],
           "posts_count": posts_count}

def public_profile(user_id,db,current_user_id=None):
    existing_user = db.query(UsersModel).filter(UsersModel.id == user_id).first()

    if not existing_user:
        raise HTTPException(status_code=404,detail="User not found")

    user_posts = db.query(PostModel).filter(PostModel.owner_id == user_id).order_by(PostModel.created_at.desc()).all()
    posts_count = len(user_posts)

    followers_count = db.query(FollowModel).filter(FollowModel.following_id == user_id).count()

    following_count = db.query(FollowModel).filter(FollowModel.follower_id == user_id).count()

    is_following = False
    if current_user_id:
        is_following = db.query(FollowModel).filter(FollowModel.follower_id == current_user_id, FollowModel.following_id == user_id).first() is not None

    return {"id" : existing_user.id,
            "avatar_url" : existing_user.profile_pic,
            "username" : existing_user.username,
            "bio" : existing_user.bio,
            "followers_count" : followers_count,
            "following_count" : following_count,
            "posts_count" : posts_count,
            "is_following" : is_following,
            "posts" : [{
                     "id": post.id,
                     "image_url": post.image_url,
                     "captions": post.captions
                    }for post in user_posts]}



def update_profile_pic(image,db,auth_user):

    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400,detail = "Only image files are allowed")

    upload_result = cloudinary.uploader.upload(
        image.file,
        folder="profile_pics",
        public_id=f"{uuid.uuid4()}",
        overwrite=True
    )
    image_url = upload_result.get("secure_url")

    old_profile_pic = auth_user.profile_pic
    auth_user.profile_pic = image_url
    db.commit()

    if old_profile_pic:
        if "cloudinary" in old_profile_pic:
            try:
                parts = old_profile_pic.split('/')
                upload_idx = parts.index('upload')
                path_parts = parts[upload_idx+1:]
                if path_parts[0].startswith('v'):
                    path_parts = path_parts[1:]
                public_id_with_ext = '/'.join(path_parts)
                public_id = public_id_with_ext.rsplit('.', 1)[0]
                cloudinary.uploader.destroy(public_id)
            except Exception:
                pass
        else:
            old_path = Path("app") / old_profile_pic.lstrip("/")
            if old_path.exists():
                old_path.unlink()

    db.refresh(auth_user)
    return auth_user

def update_bio(request : UpdateBio,db,auth_user):

    auth_user.bio = request.bio

    db.commit()
    db.refresh(auth_user)
    return auth_user

def update_username(request : UpdateUsername,db,auth_user):

    existing_username = db.query(UsersModel).filter(UsersModel.username == request.username).first()

    if existing_username:
        raise HTTPException(status_code=400,detail="Username already exists")

    auth_user.username = request.username

    db.commit()
    db.refresh(auth_user)
    return auth_user

def update_password(request : UpdatePassword,db,auth_user):

    check_pass = verify_password(request.current_password,auth_user.password)

    if not check_pass:
           raise HTTPException(status_code=400, detail="Incorrect password")

    auth_user.password = hash_password(request.new_password)

    db.commit()
    db.refresh(auth_user)
    return {"message" : "Password updated successfully"}
