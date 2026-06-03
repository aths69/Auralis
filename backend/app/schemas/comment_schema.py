from pydantic import BaseModel

class Comment(BaseModel):
    comment : str

class CommentResponse(BaseModel):
    comment : str

class DeleteCommentResponse(BaseModel):
    message : str
