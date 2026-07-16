from Database.Milvus import MilvusDatabase


class LangchainConfig():
    Database: MilvusDatabase

    def __init__(self) -> None:
        self.init()
        pass

    def init(self):
        self.Database = MilvusDatabase()
        pass

