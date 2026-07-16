
from abc import ABC, abstractmethod


class Database(ABC):

    @abstractmethod
    async def fromDocuments():
        pass

    @abstractmethod
    async def fromTexts():
        pass 