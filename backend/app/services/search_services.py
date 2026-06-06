from app.db.models import UsersModel, FollowModel

def search_user(q,limit,db):
    q = q.strip()
    if not q:
        return []
    users = db.query(UsersModel).filter(UsersModel.username.ilike(f"{q}%")).order_by(UsersModel.username.asc()).limit(limit).all()
    
    results = []
    for user in users:
        followers_count = db.query(FollowModel).filter(FollowModel.following_id == user.id).count()
        results.append({
            "id": user.id,
            "username": user.username,
            "avatar_url": user.profile_pic,
            "followers_count": followers_count
        })
        
    return results
