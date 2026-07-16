from langchain.document_loaders.text import TextLoader

from DocumentLoaders.Text_Extract import TextExtract

class Text(TextExtract):
    extractor:TextLoader

    def extract(self, path):
        self.extractor = TextLoader(path)
        return self.extractor