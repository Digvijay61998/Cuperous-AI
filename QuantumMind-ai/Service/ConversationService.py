from langchain.llms import OpenAI
from langchain.memory import ConversationBufferMemory
from Imports.CRChain import ConversationalRetrievalChain
from langchain.vectorstores.milvus import Milvus
from Configs.config import LangchainConfig
from model.models import QuestionRequest
from fastapi import HTTPException
from LLMS.bizllm import BizBot

class ConversationService():
    config: LangchainConfig
    memory: ConversationBufferMemory
    chain: ConversationalRetrievalChain
    openAiClient: BizBot
    chat_history: list


    def __init__(self) -> None:

        self.init()
        pass

    def init(self):

        self.config = LangchainConfig()
        self.memory = ConversationBufferMemory(
            memory_key="chat_history")
        self.openAiClient = BizBot(prompt="")
        self.chain = ConversationalRetrievalChain.from_llm(
            llm=self.openAiClient,
            retriever=self.config.Database.store.as_retriever(),
            memory=self.memory,
        )
        pass

    def answerQuestion(self, request:QuestionRequest):
        try:
            filter=[]
            print("INCOMING")
            print(request)
            if request.question in ["start",
                                    "text",
                                    "restart"]:
                return {"answer" : ""} 
            for doc in request.documentName:
                filter.append({"botId" :  request.bot_id ,"filename" :   doc})
            vectordbkwargs = {"search_distance": 0.9}
            # data = self.chain ({"question":request.question ,
            #                     "chat_history": request.chat_history,
            #                     "vectordbkwargs": vectordbkwargs,
            #                    "filter":filter})
            print("Here")
            data = self.chain ({"question" : request.question , "filter":filter })
            if data['answer'] in [" I'm sorry, I don't understand the question.",
                                  " I'm sorry, I don't know the answer to your question.",
                                  " I don't know.",
                                  " I'm sorry, I don't know."]:
                data["agent_forward"] =True

            data["agent_forward"] = False
            data["chat_end"] = False

            return data
        except Exception as e:
            print("An Error occured ")
            print(e)
            raise HTTPException(
                status_code=501 , 
                detail=f"Honestly I did not see that one coming Erorr :  {e.args}")
