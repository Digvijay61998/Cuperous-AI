import boto3
import os
from dotenv import load_dotenv
from DocumentLoaders.Ducument_Loader import DocumentLoader


load_dotenv()

class BotoLoader(DocumentLoader):
    storage: boto3.client

    def __init__(self):
        self.storage = boto3.client(
            's3',
            aws_access_key_id= os.getenv('AWS_ACCESS_KEY'),
            aws_secret_access_key= os.getenv('AWS_SECRET_ACCESS_KEY')
        )

    def download(self, fileLink: str):
        bucket = os.getenv('AWS_BUCKET_NAME')
        name = fileLink.split('/').pop()
        if not os.path.isdir("DocumentUploads/"):
            os.makedirs("DocumentUploads/")
        self.storage.download_file(bucket, name, 'DocumentUploads/' + name)
        return name