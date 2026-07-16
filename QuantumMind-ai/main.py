from fastapi import FastAPI
import uvicorn
from Database.Milvus import MilvusDatabase
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from Routers import IngestData, QuestionAnswer

load_dotenv()

app:FastAPI = FastAPI()

MilvusDatabase()

app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"],            #Change the cors Origin According to the fronend  
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"]
)

# routers
app.include_router(router=IngestData.router)
app.include_router(router=QuestionAnswer.router)


@app.get('/')
def root():
    return {'status': 'running'}

@app.get("/healthcheck")
async def healthcheck():
    return{
        "message" : "Server Up and Running" , 
        "status" : 200
    }

if __name__ == "__main__":
    uvicorn.run(app , host="0.0.0.0" , port=8000)

