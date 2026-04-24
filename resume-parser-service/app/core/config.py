import os
from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    port: int = int(os.getenv("PORT", 3002))
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    model_lang: str = os.getenv("MODEL_LANG", "both")  # "en", "ro", "both"
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
