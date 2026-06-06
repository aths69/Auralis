from fastapi import HTTPException
from app.db.models import PostModel,LikesModel,CommentsModel
import uuid
from pathlib import Path

def get_feed(db,limit,offset, current_user_id=None):
    posts = db.query(PostModel).order_by(PostModel.created_at.desc()).limit(limit).offset(offset).all()

    feed = []

    for post in posts:
        likes_count = db.query(LikesModel).filter(LikesModel.post_id == post.id).count()
        comments_count = db.query(CommentsModel).filter(CommentsModel.post_id == post.id).count()

        liked_by_me = False
        if current_user_id:
            liked_by_me = db.query(LikesModel).filter(LikesModel.post_id == post.id, LikesModel.user_id == current_user_id).first() is not None

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
                "avatar_url": post.user.profile_pic
            }
        })
    return feed

def get_user_posts(user_id : int,db,limit,offset, current_user_id=None):
    user_posts = db.query(PostModel).filter(PostModel.owner_id == user_id).order_by(PostModel.created_at.desc()).limit(limit).offset(offset).all()

    posts = []

    for post in user_posts:
        likes_count = db.query(LikesModel).filter(LikesModel.post_id == post.id).count()
        comments_count = db.query(CommentsModel).filter(CommentsModel.post_id == post.id).count()

        liked_by_me = False
        if current_user_id:
            liked_by_me = db.query(LikesModel).filter(LikesModel.post_id == post.id, LikesModel.user_id == current_user_id).first() is not None

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
                "avatar_url": post.user.profile_pic
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

        extension = Path(image.filename).suffix.lower()
        filename = f"{uuid.uuid4()}{extension}"

        upload_dir = Path("app/uploads/posts")
        upload_dir.mkdir(parents=True,exist_ok=True)
        file_path = upload_dir/filename

        with file_path.open("wb") as buffer:
              buffer.write(image.file.read())

        image_url = f"/uploads/posts/{filename}"

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

        extension = Path(image.filename).suffix.lower()
        filename = f"{uuid.uuid4()}{extension}"

        upload_dir = Path("app/uploads/posts")
        upload_dir.mkdir(parents=True,exist_ok=True)
        file_path = upload_dir/filename

        with file_path.open("wb") as buffer:
            buffer.write(image.file.read())

        image_url = f"/uploads/posts/{filename}"
        post.image_url = image_url

    db.commit()
    db.refresh(post)
    return post


def delete_all(db,auth_user):
    posts = db.query(PostModel).filter(PostModel.owner_id == auth_user.id).all()

    if not posts:
        raise HTTPException(status_code=404, detail="No posts found")

    image_paths = [
           Path("app") / post.image_url.lstrip("/")
           for post in posts if post.image_url
       ]

    for post in posts:
        db.query(CommentsModel).filter(CommentsModel.post_id == post.id).delete()
        db.query(LikesModel).filter(LikesModel.post_id == post.id).delete()
        db.delete(post)

    db.commit()
    for image_path in image_paths:
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
        image_path = Path("app") / image_url.lstrip("/")
        if image_path.exists():
            image_path.unlink()

    return {"message" : "Post deleted succcessfully"}
