import os
from langchain.text_splitter import RecursiveCharacterTextSplitter
from DocumentLoaders.TextExtractor.DOCX import DOCX
from DocumentLoaders.TextExtractor.TXT import Text

from typing import Any
from DocumentLoaders.TextExtractor.PDF import PDF
from langchain.docstore.document import Document


class TextSpliter():
    chunk_size: int
    chunk_overlap: int
    operative_filepath: str
    spliter: RecursiveCharacterTextSplitter

    def __init__(self) -> None:
        self.init(chunk_o=50, chunk_s=1000, file='/DocumentUploads')
        pass

    def init(self, chunk_s: int, chunk_o: int, file: str):
        self.chunk_overlap = chunk_o if chunk_o else 50  # Default Chunk Size
        self.chunk_size = chunk_s if chunk_s else 1000  # Default Chunk Values
        self.spliter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size, chunk_overlap=self.chunk_overlap)
        self.operative_filepath = file if file else '/DocumentUploads'
        pass

    def execute(self, filename: str, botId: str) -> Any:    

        absolute_path = os.path.join(
            os.getcwd()+self.operative_filepath,
            filename)
        document: list[Document] = self.textloader(absolute_path)
        for doc in document:
            doc.metadata = {
                "botId": botId  , 
                "filename" :  filename
            }
            
        os.unlink(os.path.join(os.getcwd()+self.operative_filepath, filename))
        print("SPLITTING DOCUMENTS ")
        return self.spliter.split_documents(document)

    def textloader(self, path: str):  # uses extractors according to extension

        extension = path.split('.').pop()
        match extension:
            case 'pdf':
                loader = PDF().extract(path)
                return loader.load_and_split(self.spliter)
            case 'txt':
                loader = Text().extract(path)
                return loader.load_and_split(self.spliter)
            case 'docx':
                loader = DOCX().extract(path)
                return loader.load_and_split(self.spliter)

            case _:
                raise Exception(
                    f'bad file type, Please load PDF, TXT, DOCX. Filetype recieved {extension}')
