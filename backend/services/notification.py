import abc
from enum import StrEnum

import requests
from settings import SETTINGS

import requests



class NotificationServiceTypes(StrEnum):
    PUSHOVER = "pushover"
    TELEGRAM = "telegram"

class NotificationService(abc.ABC):
    @abc.abstractmethod
    def send_notification(self, message: str):
        raise NotImplementedError()

class PushoverService(NotificationService):
    def send_notification(self, message: str):
        payload = {"user": SETTINGS.pushover.user, "token": SETTINGS.pushover.token, "message": message}
        requests.post(SETTINGS.pushover.url, data=payload)

class TelegramService(NotificationService):
    def send_notification(self, message: str):
        try:
            response = requests.post(
                f"https://api.telegram.org/bot{SETTINGS.telegram.token}/sendMessage",
                json={
                    "chat_id": SETTINGS.telegram.chat_id,
                    "text": message
                }
            )
            data = response.    json()

            if data.get("ok") == False:
                return f"error in telegram notification: {data.get('error_code', 'unknown')}: {data.get('description', 'unknown')}"
        except Exception as e:
            return f"error in telegram notification: {str(e)}"

        return "OK"

class NotificationServiceFactory():
    @staticmethod
    def factory_method(service_type: NotificationServiceTypes):
        factories = {
            NotificationServiceTypes.PUSHOVER: PushoverService,
            NotificationServiceTypes.TELEGRAM: TelegramService
        }
        
        notification_class = factories.get(service_type)
        if notification_class:
            return notification_class()

        raise NotImplementedError()