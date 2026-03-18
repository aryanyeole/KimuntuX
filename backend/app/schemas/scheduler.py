from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


RecurrenceType = Literal["once", "weekly", "biweekly", "monthly"]


class SchedulerItemBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    start_date: date | None = None
    end_date: date | None = None
    send_time: str | None = Field(default=None, max_length=10)
    interval: RecurrenceType = "once"
    platforms: list[str] = Field(default_factory=list)
    cost: str | None = Field(default=None, max_length=50)
    color: str | None = Field(default=None, max_length=20)


class SchedulerItemCreate(SchedulerItemBase):
    pass


class SchedulerItemUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    start_date: date | None = None
    end_date: date | None = None
    send_time: str | None = Field(default=None, max_length=10)
    interval: RecurrenceType | None = None
    platforms: list[str] | None = None
    cost: str | None = Field(default=None, max_length=50)
    color: str | None = Field(default=None, max_length=20)


class SchedulerItemResponse(SchedulerItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime