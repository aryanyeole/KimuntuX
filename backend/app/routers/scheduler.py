from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.scheduler_item import SchedulerItem
from app.models.user import User
from app.schemas.scheduler import (
    SchedulerItemCreate,
    SchedulerItemResponse,
    SchedulerItemUpdate,
)


router = APIRouter(prefix="/scheduler", tags=["scheduler"])


@router.get("", response_model=list[SchedulerItemResponse])
def list_scheduler_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[SchedulerItemResponse]:
    items = db.scalars(
        select(SchedulerItem)
        .where(SchedulerItem.user_id == current_user.id)
        .order_by(SchedulerItem.created_at.desc())
    ).all()
    return list(items)


@router.post("", response_model=SchedulerItemResponse, status_code=status.HTTP_201_CREATED)
def create_scheduler_item(
    payload: SchedulerItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SchedulerItemResponse:
    item = SchedulerItem(
        user_id=current_user.id,
        name=payload.name.strip(),
        start_date=payload.start_date,
        end_date=payload.end_date,
        send_time=payload.send_time,
        interval=payload.interval,
        platforms=payload.platforms,
        cost=payload.cost,
        color=payload.color,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=SchedulerItemResponse)
def update_scheduler_item(
    item_id: str,
    payload: SchedulerItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SchedulerItemResponse:
    item = db.scalar(
        select(SchedulerItem).where(
            SchedulerItem.id == item_id,
            SchedulerItem.user_id == current_user.id,
        )
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheduler item not found")

    updates = payload.model_dump(exclude_unset=True)
    if "name" in updates and updates["name"] is not None:
        updates["name"] = updates["name"].strip()

    for key, value in updates.items():
        setattr(item, key, value)

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scheduler_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    item = db.scalar(
        select(SchedulerItem).where(
            SchedulerItem.id == item_id,
            SchedulerItem.user_id == current_user.id,
        )
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheduler item not found")

    db.delete(item)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)