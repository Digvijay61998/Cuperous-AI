# start by pulling the python image
FROM public.ecr.aws/a9h0y7b5/python-3.11.2

ENV https_proxy <proxy settings>

# copy the requirements file into the image
COPY ./requirements.txt /app/requirements.txt

# switch working directory
WORKDIR /app

RUN pip install --upgrade pip

RUN pip install chromadb  openai

RUN pip install python-dotenv



RUN pip install Numpy
# install the dependencies and packages in the requirements file
RUN pip3 install --proxy <proxy settings> -r requirements.txt

# copy every content from the local file to the image
COPY . /app

ENV https_proxy ""

# configure the container to run in an executed manner
ENTRYPOINT [ "python3" ]

CMD ["main.py" ]

