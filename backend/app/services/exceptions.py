"""Domain exceptions shared across service modules."""
from __future__ import annotations


class TenantIsolationError(Exception):
    """Raised when an operation targets a resource that does not belong to the caller's tenant."""


class SendGridSendError(Exception):
    """Raised when the SendGrid API returns an error during an outbound send."""


class InboundRoutingError(Exception):
    """Raised when an inbound email cannot be routed to a tenant (unroutable or ambiguous)."""
