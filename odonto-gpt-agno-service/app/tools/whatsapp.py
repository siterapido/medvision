"""
Z-API WhatsApp Client for Agno Service

This module provides integration with Z-API (https://z-api.io/)
to send and receive WhatsApp messages.
"""

import os
import httpx
from typing import Optional, Dict, Any
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)


class ZApiConfig(BaseModel):
    """Z-API configuration"""
    instance_id: str
    token: str
    client_token: str
    base_url: str = "https://api.z-api.io/instances"


class ZApiMessage(BaseModel):
    """WhatsApp message model"""
    phone: str
    message: str


def get_zapi_config() -> ZApiConfig:
    """
    Load Z-API configuration from environment variables.

    Required environment variables:
    - Z_API_INSTANCE_ID: Z-API instance ID
    - Z_API_TOKEN: Z-API instance token
    - Z_API_CLIENT_TOKEN: Z-API client token

    Returns:
        ZApiConfig: Configuration object

    Raises:
        ValueError: If required environment variables are missing
    """
    instance_id = os.getenv("Z_API_INSTANCE_ID")
    token = os.getenv("Z_API_TOKEN")
    client_token = os.getenv("Z_API_CLIENT_TOKEN")

    if not instance_id:
        raise ValueError("Z_API_INSTANCE_ID environment variable is required")
    if not token:
        raise ValueError("Z_API_TOKEN environment variable is required")
    if not client_token:
        raise ValueError("Z_API_CLIENT_TOKEN environment variable is required")

    return ZApiConfig(
        instance_id=instance_id,
        token=token,
        client_token=client_token
    )


def clean_phone_number(phone: str) -> str:
    """
    Clean and format phone number for Z-API.

    Args:
        phone: Raw phone number (can have formatting)

    Returns:
        str: Clean phone number in E.164 format with +55 country code
    """
    # Remove all non-digit characters
    clean = "".join(c for c in phone if c.isdigit())

    # If no country code and length matches BR numbers (10-11 digits), add +55
    if 10 <= len(clean) <= 11:
        clean = f"55{clean}"

    return clean


async def send_text_message(phone: str, message: str) -> Dict[str, Any]:
    """
    Send a text message via WhatsApp using Z-API.

    Args:
        phone: Phone number (will be cleaned/formatted)
        message: Message text to send

    Returns:
        Dict with Z-API response

    Raises:
        ValueError: If Z-API configuration is missing
        httpx.HTTPError: If the request fails

    Example:
        >>> await send_text_message("+5511999999999", "Hello from Odonto GPT!")
        {'zaapId': '123', 'id': '456', 'messageId': '789'}
    """
    try:
        config = get_zapi_config()
    except ValueError as e:
        logger.error(f"Z-API configuration error: {e}")
        raise

    # Clean phone number
    clean_phone = clean_phone_number(phone)

    # Build Z-API URL
    url = f"{config.base_url}/{config.instance_id}/token/{config.token}/send-text"

    # Prepare headers
    headers = {
        "Content-Type": "application/json",
        "Client-Token": config.client_token
    }

    # Prepare payload
    payload = {
        "phone": clean_phone,
        "message": message
    }

    logger.info(f"Sending WhatsApp message to {clean_phone}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            result = response.json()
            logger.info(f"Message sent successfully: {result}")
            return result

    except httpx.HTTPError as e:
        logger.error(f"Failed to send WhatsApp message: {e}")
        raise


async def send_message(phone: str, message: str) -> Dict[str, Any]:
    """
    Alias for send_text_message for backward compatibility.

    Args:
        phone: Phone number
        message: Message text

    Returns:
        Dict with Z-API response
    """
    return await send_text_message(phone, message)


def send_text_message_sync(phone: str, message: str) -> Dict[str, Any]:
    """
    Synchronous version of send_text_message.

    Args:
        phone: Phone number
        message: Message text

    Returns:
        Dict with Z-API response
    """
    try:
        config = get_zapi_config()
    except ValueError as e:
        logger.error(f"Z-API configuration error: {e}")
        raise

    clean_phone = clean_phone_number(phone)
    url = f"{config.base_url}/{config.instance_id}/token/{config.token}/send-text"

    headers = {
        "Content-Type": "application/json",
        "Client-Token": config.client_token
    }

    payload = {
        "phone": clean_phone,
        "message": message
    }

    logger.info(f"Sending WhatsApp message (sync) to {clean_phone}")

    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                url,
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            result = response.json()
            logger.info(f"Message sent successfully: {result}")
            return result

    except httpx.HTTPError as e:
        logger.error(f"Failed to send WhatsApp message: {e}")
        raise


# Convenience function for common use case
def send_whatsapp_message(phone: str, message: str) -> Dict[str, Any]:
    """
    Send a WhatsApp message (synchronous, most common use case).

    Args:
        phone: Phone number (will be cleaned/formatted)
        message: Message text

    Returns:
        Dict with Z-API response

    Example:
        >>> send_whatsapp_message("11999999999", "Hello!")
        {'zaapId': '123', 'id': '456', 'messageId': '789'}
    """
    return send_text_message_sync(phone, message)
