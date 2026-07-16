from DocumentLoaders.factory.Loader_factory import BotoLoaderFactory
from Service.service import TextSpliter
from Configs.config import LangchainConfig
from model.models import RequestDto, TextRequest
from fastapi import HTTPException
import traceback
class AiService():
    config: LangchainConfig
    text_splitter: TextSpliter
    downloader:BotoLoaderFactory

    def __init__(self) -> None:
        self.init()
        pass

    def init(self):
        self.config = LangchainConfig()
        self.text_splitter = TextSpliter()
        self.downloader = BotoLoaderFactory()
        pass

    def ingestData(self, request:RequestDto):

        try:
            for file in request.documents:
                print(" FILE Downloader ready ")
                loader = self.downloader.create_loader()

                filename = loader.download(file)
                print(" FILE DOWNLOADED ")
                splitDocument = self.text_splitter.execute(filename, request.botId)
                print('here')
                self.config.Database.fromDocuments(splitDocument)
            return {'success': 'file ingestion complete'}
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(
                status_code=500,
                detail='Ingest Failed'
            )

    def ingestText(self, request: TextRequest):
        
        try:
            print("INCOMING REQUEST")
            print(request)
            self.config.Database.fromTexts(request.text, request.meta, request.document_name)
            return {'success': 'file ingestion complete'}
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail='vector store error'
            )



