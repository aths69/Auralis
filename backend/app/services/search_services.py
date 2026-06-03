from app.db.models import UsersModel

def search_user(q,limit,db):
    q = q.strip()
    if not q:
        return []
    users = db.query(UsersModel).filter(UsersModel.username.ilike(f"{q}%")).order_by(UsersModel.username.asc()).limit(limit).all()
    return users
