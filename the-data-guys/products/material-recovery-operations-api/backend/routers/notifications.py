import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.notifications import NotificationsService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/notifications", tags=["notifications"])


# ---------- Pydantic Schemas ----------
class NotificationsData(BaseModel):
    """Entity data schema (for create/update)"""
    type: str
    title: str
    message: str
    is_read: bool = None
    extra_data: str = None


class NotificationsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    type: Optional[str] = None
    title: Optional[str] = None
    message: Optional[str] = None
    is_read: Optional[bool] = None
    extra_data: Optional[str] = None


class NotificationsResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    type: str
    title: str
    message: str
    is_read: Optional[bool] = None
    extra_data: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationsListResponse(BaseModel):
    """List response schema"""
    items: List[NotificationsResponse]
    total: int
    skip: int
    limit: int


class NotificationsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[NotificationsData]


class NotificationsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: NotificationsUpdateData


class NotificationsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[NotificationsBatchUpdateItem]


class NotificationsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=NotificationsListResponse)
async def query_notificationss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query notificationss with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying notificationss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = NotificationsService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")
        
        result = await service.get_list(
            skip=skip, 
            limit=limit,
            query_dict=query_dict,
            sort=sort,
            user_id=str(current_user.id),
        )
        logger.debug(f"Found {result['total']} notificationss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying notificationss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=NotificationsListResponse)
async def query_notificationss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query notificationss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying notificationss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = NotificationsService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")

        result = await service.get_list(
            skip=skip,
            limit=limit,
            query_dict=query_dict,
            sort=sort
        )
        logger.debug(f"Found {result['total']} notificationss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying notificationss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=NotificationsResponse)
async def get_notifications(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single notifications by ID (user can only see their own records)"""
    logger.debug(f"Fetching notifications with id: {id}, fields={fields}")
    
    service = NotificationsService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Notifications with id {id} not found")
            raise HTTPException(status_code=404, detail="Notifications not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching notifications {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=NotificationsResponse, status_code=201)
async def create_notifications(
    data: NotificationsData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new notifications"""
    logger.debug(f"Creating new notifications with data: {data}")
    
    service = NotificationsService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create notifications")
        
        logger.info(f"Notifications created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating notifications: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating notifications: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[NotificationsResponse], status_code=201)
async def create_notificationss_batch(
    request: NotificationsBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple notificationss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} notificationss")
    
    service = NotificationsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} notificationss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[NotificationsResponse])
async def update_notificationss_batch(
    request: NotificationsBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple notificationss in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} notificationss")
    
    service = NotificationsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} notificationss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=NotificationsResponse)
async def update_notifications(
    id: int,
    data: NotificationsUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing notifications (requires ownership)"""
    logger.debug(f"Updating notifications {id} with data: {data}")

    service = NotificationsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Notifications with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Notifications not found")
        
        logger.info(f"Notifications {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating notifications {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating notifications {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_notificationss_batch(
    request: NotificationsBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple notificationss by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} notificationss")
    
    service = NotificationsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} notificationss successfully")
        return {"message": f"Successfully deleted {deleted_count} notificationss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_notifications(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single notifications by ID (requires ownership)"""
    logger.debug(f"Deleting notifications with id: {id}")
    
    service = NotificationsService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Notifications with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Notifications not found")
        
        logger.info(f"Notifications {id} deleted successfully")
        return {"message": "Notifications deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting notifications {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")