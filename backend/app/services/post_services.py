from fastapi import HTTPException
from app.db.models import PostModel,LikesModel,CommentsModel,FollowModel
import uuid
from pathlib import Path
import cloudinary.uploader

def get_feed(db,limit,offset, current_user_id=None):
    posts = db.query(PostModel).order_by(PostModel.created_at.desc()).limit(limit).offset(offset).all()

    feed = []

    for post in posts:
        likes_count = db.query(LikesModel).filter(LikesModel.post_id == post.id).count()
        comments_count = db.query(CommentsModel).filter(CommentsModel.post_id == post.id).count()

        is_following = False
        if current_user_id:
            liked_by_me = db.query(LikesModel).filter(LikesModel.post_id == post.id, LikesModel.user_id == current_user_id).first() is not None
            is_following = db.query(FollowModel).filter(FollowModel.follower_id == current_user_id, FollowModel.following_id == post.user.id).first() is not None

        feed.append({
            "id": post.id,
            "content": post.captions or "",
            "captions": post.captions,
            "image_url": post.image_url,
            "created_at": post.created_at,
            "like_count": likes_count,
            "comment_count" : comments_count,
            "liked_by_me": liked_by_me,
            "user": {
                "id": post.user.id,
                "username": post.user.username,
                "email": post.user.email,
                "bio": post.user.bio,
                "avatar_url": post.user.profile_pic,
                "is_following": is_following
            }
        })
    return feed

def get_user_posts(user_id : int,db,limit,offset, current_user_id=None):
    user_posts = db.query(PostModel).filter(PostModel.owner_id == user_id).order_by(PostModel.created_at.desc()).limit(limit).offset(offset).all()

    posts = []

    for post in user_posts:
        likes_count = db.query(LikesModel).filter(LikesModel.post_id == post.id).count()
        comments_count = db.query(CommentsModel).filter(CommentsModel.post_id == post.id).count()

        is_following = False
        if current_user_id:
            liked_by_me = db.query(LikesModel).filter(LikesModel.post_id == post.id, LikesModel.user_id == current_user_id).first() is not None
            is_following = db.query(FollowModel).filter(FollowModel.follower_id == current_user_id, FollowModel.following_id == post.user.id).first() is not None

        posts.append({
            "id": post.id,
            "content": post.captions or "",
            "captions": post.captions,
            "image_url": post.image_url,
            "created_at": post.created_at,
            "like_count": likes_count,
            "comment_count" : comments_count,
            "liked_by_me": liked_by_me,
            "user": {
                "id": post.user.id,
                "username": post.user.username,
                "email": post.user.email,
                "bio": post.user.bio,
                "avatar_url": post.user.profile_pic,
                "is_following": is_following
            }
        })

    return posts

def create_post(image,captions,db,auth_user):
    if not image and not captions:
        raise HTTPException(status_code=400,detail = "Post must have an image or text content")

    image_url = None
    if image:
        if not image.content_type or not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400,detail = "Only image files are allowed")

        upload_result = cloudinary.uploader.upload(
            image.file,
            folder="posts",
            public_id=f"{uuid.uuid4()}",
            overwrite=True
        )
        image_url = upload_result.get("secure_url")

    new_post = PostModel(captions = captions,image_url = image_url,owner_id=auth_user.id)

    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

def update_post(post_id : int,image,captions,db,auth_user):

    post = db.query(PostModel).filter(PostModel.id == post_id).first()

    if not post:
        raise HTTPException(status_code=404,detail="Post not found")

    if(auth_user.id != post.owner_id):
        raise HTTPException(status_code=403,detail="Unauthorized")

    if captions is not None:
        post.captions = captions

    if image is not None:
        if not image.content_type or not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400,detail = "Only image files are allowed")

        upload_result = cloudinary.uploader.upload(
            image.file,
            folder="posts",
            public_id=f"{uuid.uuid4()}",
            overwrite=True
        )
        image_url = upload_result.get("secure_url")
        post.image_url = image_url

    db.commit()
    db.refresh(post)
    return post


def delete_all(db,auth_user):
    posts = db.query(PostModel).filter(PostModel.owner_id == auth_user.id).all()

    if not posts:
        raise HTTPException(status_code=404, detail="No posts found")

    image_urls = [post.image_url for post in posts if post.image_url]

    for post in posts:
        db.query(CommentsModel).filter(CommentsModel.post_id == post.id).delete()
        db.query(LikesModel).filter(LikesModel.post_id == post.id).delete()
        db.delete(post)

    db.commit()
    for url in image_urls:
        if "cloudinary" in url:
            try:
                parts = url.split('/')
                upload_idx = parts.index('upload')
                path_parts = parts[upload_idx+1:]
                if path_parts[0].startswith('v'):
                    path_parts = path_parts[1:]
                public_id = '/'.join(path_parts).rsplit('.', 1)[0]
                cloudinary.uploader.destroy(public_id)
            except Exception:
                pass
        else:
            image_path = Path("app") / url.lstrip("/")
            if image_path.exists():
                image_path.unlink()


    return {"message": "All posts deleted"}

def delete_post(post_id : int,db,auth_user):

    post = db.query(PostModel).filter(PostModel.id == post_id).first()

    if not post:
        raise HTTPException(status_code=404,detail="Post not found")

    if(auth_user.id != post.owner_id):
        raise HTTPException(status_code=403,detail="Unauthorized")

    image_url = post.image_url
    db.query(CommentsModel).filter(CommentsModel.post_id == post_id).delete()
    db.query(LikesModel).filter(LikesModel.post_id == post_id).delete()

    db.delete(post)
    db.commit()

    if image_url:
        if "cloudinary" in image_url:
            try:
                parts = image_url.split('/')
                upload_idx = parts.index('upload')
                path_parts = parts[upload_idx+1:]
                if path_parts[0].startswith('v'):
                    path_parts = path_parts[1:]
                public_id = '/'.join(path_parts).rsplit('.', 1)[0]
                cloudinary.uploader.destroy(public_id)
            except Exception:
                pass
        else:
            image_path = Path("app") / image_url.lstrip("/")
            if image_path.exists():
                image_path.unlink()

    return {"message" : "Post deleted succcessfully"}
