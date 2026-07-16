from langchain.document_loaders import Docx2txtLoader

from DocumentLoaders.Text_Extract import TextExtract

class DOCX(TextExtract):
    extractor: Docx2txtLoader

    def __init__(self) -> None:
        pass

    def extract(self, path):
        self.extractor = Docx2txtLoader(path)
        return self.extractor