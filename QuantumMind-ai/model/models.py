from typing import List, Dict , Any

import pydantic


class RequestDto(pydantic.BaseModel):
    botId:str
    documents:List[str]

class Response(pydantic.BaseModel):
    status:int
    message:str
    upload_status:bool

class Metadata(pydantic.BaseModel):
    bot_id:str

class TextRequest(pydantic.BaseModel):
    text:str 
    document_name:str 
    meta: Metadata

class QuestionRequest(pydantic.BaseModel):
    question:str
    bot_id:str
    documentName:List[str]
    chat_history:List[Any]              #Temporryr testing change need to be updated back to dict for proper working 

    
