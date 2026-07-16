from fastapi import APIRouter
from Service.ConversationService import ConversationService
from model.models import QuestionRequest

router = APIRouter(
    prefix='/query',
    tags=['question']
)

@router.post('/ask_Question')
def chatQuestions(request:QuestionRequest):
    conversationService =  ConversationService()
    return conversationService.answerQuestion(request)

