from sqlalchemy.types import Boolean
from app.db.database import Base
from sqlalchemy import Column, ForeignKey, Integer, String,DateTime,UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import timezone,datetime

class UsersModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=False)
    username = Column(String, nullable=False, unique=True)
    bio = Column(String)
    profile_pic = Column(String)
    is_verified = Column(Boolean,default=False,nullable=False)
    verification_token = Column(String, nullable=True)

    posts = relationship("PostModel",back_populates="user")
    likes = relationship("LikesModel",back_populates="user")
    comments = relationship("CommentsModel",back_populates="user")
    followers = relationship("FollowModel",foreign_keys="FollowModel.following_id",back_populates="following_user")
    following = relationship("FollowModel",foreign_keys="FollowModel.follower_id",back_populates="follower_user")
    notification_sent = relationship("NotificationModel",foreign_keys="NotificationModel.sender_id",back_populates="sender_user")
    notification_received = relationship("NotificationModel",foreign_keys="NotificationModel.receiver_id",back_populates="receiver_user")

class PostModel(Base):

    __tablename__ = "posts"
    id = Column(Integer,primary_key=True,index = True)
    captions = Column(String)
    image_url = Column(String,nullable=True)
    owner_id = Column(Integer,ForeignKey("users.id"),nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_pinned = Column(Boolean, default=False)

    user = relationship("UsersModel",back_populates="posts")
    likes = relationship("LikesModel",back_populates="post")
    comments = relationship("CommentsModel",back_populates="post")

class LikesModel(Base):

    __tablename__ = "likes"
    id = Column(Integer,primary_key=True,index=True)
    user_id = Column(Integer,ForeignKey("users.id"),nullable=False)
    post_id = Column(Integer,ForeignKey("posts.id"),nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (UniqueConstraint("user_id","post_id",name="unique_user_post_like"),)

    user = relationship("UsersModel",back_populates="likes")
    post = relationship("PostModel",back_populates="likes")

class CommentsModel(Base):

    __tablename__ = "comments"
    id = Column(Integer,primary_key=True,index = True)
    comment = Column(String,nullable=False)
    user_id = Column(Integer,ForeignKey("users.id"),nullable=False)
    post_id = Column(Integer,ForeignKey("posts.id"),nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("UsersModel",back_populates="comments")
    post = relationship("PostModel",back_populates="comments")

class FollowModel(Base):

    __tablename__ = "follows"
    id = Column(Integer,primary_key=True,index=True)
    follower_id = Column(Integer,ForeignKey("users.id"),nullable=False)
    following_id = Column(Integer,ForeignKey("users.id"),nullable=False)

    follower_user = relationship("UsersModel",foreign_keys=[follower_id],back_populates="following")
    following_user = relationship("UsersModel",foreign_keys=[following_id],back_populates="followers")

    __table_args__ = (UniqueConstraint("follower_id","following_id",name="unique_follow"),)

class NotificationModel(Base):

    __tablename__ = "notifications"
    id = Column(Integer,primary_key=True,index=True)
    sender_id = Column(Integer,ForeignKey("users.id"),nullable=False)
    receiver_id = Column(Integer,ForeignKey("users.id"),nullable=False)
    message = Column(String,nullable=False)
    post_id = Column(Integer,ForeignKey("posts.id"))
    is_read = Column(Boolean,default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    sender_user = relationship("UsersModel", foreign_keys=[sender_id],back_populates="notification_sent")
    receiver_user = relationship("UsersModel",foreign_keys=[receiver_id],back_populates="notification_received")
