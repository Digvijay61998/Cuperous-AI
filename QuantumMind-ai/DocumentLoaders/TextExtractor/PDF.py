from langchain.document_loaders import PyPDFLoader
from DocumentLoaders.Text_Extract import TextExtract


class PDF(TextExtract):
    extractor: PyPDFLoader

    def __init__(self) -> None:
        pass

    def extract(self, path):
        self.extractor = PyPDFLoader(path)
        return self.extractor
