
from abc import ABC, abstractmethod
from DocumentLoaders.loader.BotoLoader import BotoLoader


class LoaderFactory(ABC):

    @abstractmethod
    def create_loader(self):
        pass


class BotoLoaderFactory(LoaderFactory):
    
    def __init__(self) -> None:
        super().__init__()

    def create_loader(self):
        return BotoLoader()