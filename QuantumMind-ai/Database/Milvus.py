
from Imports.Milvus import Milvus
from Database.Database import Database
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.embeddings import HuggingFaceEmbeddings
from fastapi import HTTPException
import os
from dotenv import load_dotenv
load_dotenv()


class MilvusDatabase(Database):
    store: Milvus
    embeddings: HuggingFaceEmbeddings
    # embeddings :OpenAIEmbeddings
    collection_name: str
    _instance = None

    def __new__(cls):
        
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):

        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        # self.embeddings = OpenAIEmbeddings()
        self.collection_name = 'doc_recommendations_test'
        self.store = Milvus(self.embeddings,collection_name=self.collection_name, connection_args={"host": "localhost", "port": "19530"} )

    def fromDocuments(self, documents):
        print()
        self.store.from_documents(documents=documents,
                                   embedding=self.embeddings,
                                   collection_name=self.collection_name)
        return


    def fromTexts(self, text, meta, doc):
        print({'botId':meta.bot_id,'filename' : doc})
        try:
            self.store.from_texts(texts=[text],
                            embedding=self.embeddings,
                            metadatas=[{'botId':meta.bot_id,'filename' : doc}],
                            collection_name=self.collection_name)
        except Exception as e:
            raise HTTPException(
                status_code=501 , 
                detail=f'A minor error occured {e}'
            )
    def dropAll(self):
        try:
            print("DROPPING ALL DATA")
        except Exception as e:
            raise HTTPException(
                status_code=501 ,
                detail=e
            )