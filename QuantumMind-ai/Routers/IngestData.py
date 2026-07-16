from fastapi import APIRouter, Request
from Service.IngestService import AiService
import os
from model.models import RequestDto, TextRequest


router = APIRouter(
    prefix='/ingestData',
    tags=['IngestData']
)

@router.get('/')
def root():
    return {'word':'send a POST request with pdf file to /ingestData'}

@router.post('/upload_file/')
def indexload(request :RequestDto):
    print("INCOMING PAYLOAD")
    print(request)
    aiService = AiService()
    return  aiService.ingestData(request)


@router.post('/upload_text/')
def loadData(request: TextRequest ):
    print(request)
    aiservice = AiService()
    return aiservice.ingestText(request)