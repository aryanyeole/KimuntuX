from __future__ import annotations

import asyncio
import base64

from fastapi import HTTPException, status
from google import genai
from google.genai import types

from app.core.config import settings


class ImageGeneratorService:
    _PLATFORM_CONTEXTS = {
        'instagram': 'Square 1:1 social media image, vibrant and eye-catching. ',
        'email': 'Wide 16:9 professional email banner image. ',
        'youtube': 'YouTube thumbnail, bold text space on left, high contrast, 16:9. ',
        'tiktok': 'Vertical 9:16 social media image, trendy and energetic. ',
        'facebook': 'Square social media image, clean and professional. ',
        'linkedin': 'Professional 1.91:1 LinkedIn post image, clean corporate style. ',
    }

    async def generate_image(self, prompt: str, platform: str) -> str:
        if not settings.gemini_api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail='Gemini API key is not configured for image generation.',
            )

        enhanced_prompt = self._build_prompt(prompt, platform)

        try:
            return await asyncio.to_thread(self._generate_image_sync, enhanced_prompt)
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f'Image generation failed: {exc}',
            ) from exc

    def _build_prompt(self, prompt: str, platform: str) -> str:
        platform_key = str(platform or '').strip().lower()
        platform_context = self._PLATFORM_CONTEXTS.get(platform_key, 'Marketing image, clean and professional. ')
        return f'{platform_context}{str(prompt or "").strip()}'.strip()

    def _generate_image_sync(self, enhanced_prompt: str) -> str:
        client = genai.Client(api_key=settings.gemini_api_key)
        response = client.models.generate_content(
            model='gemini-2.5-flash-image',
            contents=enhanced_prompt,
            config=types.GenerateContentConfig(
                response_modalities=['IMAGE', 'TEXT'],
            ),
        )

        candidates = getattr(response, 'candidates', None) or []
        for candidate in candidates:
            content = getattr(candidate, 'content', None)
            parts = getattr(content, 'parts', None) or []
            for part in parts:
                inline_data = getattr(part, 'inline_data', None)
                data = getattr(inline_data, 'data', None) if inline_data else None
                if not data:
                    continue

                mime_type = (getattr(inline_data, 'mime_type', None) if inline_data else None) or 'image/png'
                encoded = base64.b64encode(data).decode('utf-8')
                return f'data:{mime_type};base64,{encoded}'

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail='Gemini did not return an image result.',
        )