"""test_anthropic_client.py — unit tests for the Anthropic client exception classifier.

These tests verify that _classify_bad_request routes correctly without
needing a live API key or network call.
"""

from __future__ import annotations

from app.integrations.anthropic_client import (
    AnthropicError,
    AnthropicInsufficientCredits,
    _classify_bad_request,
)


class TestClassifyBadRequest:
    def test_credit_balance_message_raises_insufficient_credits(self):
        """'credit balance too low' message must yield AnthropicInsufficientCredits."""
        exc = Exception(
            "Your credit balance is too low to access the Anthropic API. "
            "Please go to Plans & Billing to upgrade or purchase credits."
        )
        result = _classify_bad_request(exc)
        assert isinstance(result, AnthropicInsufficientCredits), (
            f"Expected AnthropicInsufficientCredits, got {type(result).__name__}"
        )

    def test_credit_balance_check_is_case_insensitive(self):
        """The substring check must be case-insensitive."""
        exc = Exception("Your Credit Balance is too low.")
        result = _classify_bad_request(exc)
        assert isinstance(result, AnthropicInsufficientCredits)

    def test_generic_bad_request_returns_base_anthropic_error(self):
        """A non-credits 400 (e.g. bad parameter) must NOT yield InsufficientCredits."""
        exc = Exception("max_tokens must be a positive integer")
        result = _classify_bad_request(exc)
        assert type(result) is AnthropicError, (
            f"Expected bare AnthropicError, got {type(result).__name__}"
        )
        assert not isinstance(result, AnthropicInsufficientCredits)

    def test_unrelated_message_returns_base_anthropic_error(self):
        """Unrelated message must not be misclassified."""
        exc = Exception("model is required")
        result = _classify_bad_request(exc)
        assert type(result) is AnthropicError
        assert not isinstance(result, AnthropicInsufficientCredits)
