from pathlib import Path
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = Path(__file__).resolve().parent / ".env"

class PushoverSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix='PUSHOVER_', env_file=ENV_FILE, extra="ignore")

    user: str = ""
    token: str = ""
    url: str = ""

class OpenRouterSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix='OPENROUTER_', env_file=ENV_FILE, extra="ignore")

    api_key: str = ""
    path: str = ""
    model: str = ""
    provider: str = ""

class TelegramSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix='TELEGRAM_', env_file=ENV_FILE, extra="ignore")

    token: str = ""
    chat_id: str = ""

class Settings(BaseSettings):
    open_router: OpenRouterSettings
    pushover: PushoverSettings
    telegram: TelegramSettings
    
SETTINGS = Settings(
    open_router=OpenRouterSettings(),
    pushover=PushoverSettings(),
    telegram=TelegramSettings()
)