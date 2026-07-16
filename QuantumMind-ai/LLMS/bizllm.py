from langchain.llms.base import LLM
from langchain.callbacks.manager import CallbackManagerForLLMRun
from typing import Any , Optional , List , Mapping , Dict
from LLMS.payload_config import DEFAULT_AI_PAYLOAD
from requests import (request , HTTPError)
from os import getenv
import logging
import json

logger = logging.getLogger(__name__)

DEFAULT_PROMPT = """
        <|prompt|>You are helpful chatbot which will read the given prompt and answer accordingly\n $PROMPT \n <|endoftext|><|answer|>
    """

class BizBot(LLM):
    prompt:str=DEFAULT_AI_PAYLOAD
    
    @property
    def _llm_type(self) -> str:
        return "custom"
    
    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
    ) -> str:
        try :
            print("INCOMING PROMPT")
            print(prompt)
            self._getPrompt(prompt=prompt)
            print(self.prompt)
            DEFAULT_AI_PAYLOAD["inputs"] = self.prompt
            # Api call here 
            response=self._call_server(DEFAULT_AI_PAYLOAD)
            self._reset_promt()    
            return response["generated_text"]
        
        except HTTPError as e:
            print("An Error Occured ")
            raise HTTPError("Failed to fetch message " , 505)
        finally :
            print("PROCESS COMPLETED")

    def _call_server(self , payload:Dict):
        url = f"http://{getenv('INFERENCE')}:4000/generate"
        print("incoming PAYLOAD")
        print(payload)
        response = request(
                method="post" ,
                url=url ,
                headers = {"Content-Type": "application/json"},
                data=json.dumps(payload)
        )
        print("INCOMING REQUEST")
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPError("Failed to fetch response " , 501)  

    def _reset_promt(self):
        self.prompt  = DEFAULT_PROMPT
        
    @property
    def _identifying_params(self) -> Mapping[str, Any]:
        """Get the identifying parameters."""
        return {"n": self.prompt}
    
    
    def _getPrompt(self , prompt:str):
        self.prompt = DEFAULT_PROMPT.replace("$PROMPT"  , prompt)