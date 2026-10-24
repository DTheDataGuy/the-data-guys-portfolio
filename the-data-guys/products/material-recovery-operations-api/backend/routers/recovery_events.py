import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.recovery_events import Recovery_eventsService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/recovery_events", tags=["recovery_events"])


# ---------- Pydantic Schemas ----------
class Recovery_eventsData(BaseModel):
    """Entity data schema (for create/update)"""
    material_type: str
    recovery_method: str
    quantity_tons: float
    estimated_value: float = None
    recovery_date: str
    destination: str = None
    notes: str = None


class Recovery_eventsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    material_type: Optional[str] = None
    recovery_method: Optional[str] = None
    quantity_tons: Optional[float] = None
    estimated_value: Optional[float] = None
    recovery_date: Optional[str] = None
    destination: Optional[str] = None
    notes: Optional[str] = None


class Recovery_eventsResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    material_type: str
    recovery_method: str
    quantity_tons: float
    estimated_value: Optional[float] = None
    recovery_date: str
    destination: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Recovery_eventsListResponse(BaseModel):
    """List response schema"""
    items: List[Recovery_eventsResponse]
    total: int
    skip: int
    limit: int


class Recovery_eventsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Recovery_eventsData]


class Recovery_eventsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Recovery_eventsUpdateData


class Recovery_eventsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Recovery_eventsBatchUpdateItem]


class Recovery_eventsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Recovery_eventsListResponse)
async def query_recovery_eventss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query recovery_eventss with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying recovery_eventss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Recovery_eventsService(db)
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
        logger.debug(f"Found {result['total']} recovery_eventss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying recovery_eventss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Recovery_eventsListResponse)
async def query_recovery_eventss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query recovery_eventss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying recovery_eventss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Recovery_eventsService(db)
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
        logger.debug(f"Found {result['total']} recovery_eventss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying recovery_eventss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Recovery_eventsResponse)
async def get_recovery_events(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single recovery_events by ID (user can only see their own records)"""
    logger.debug(f"Fetching recovery_events with id: {id}, fields={fields}")
    
    service = Recovery_eventsService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Recovery_events with id {id} not found")
            raise HTTPException(status_code=404, detail="Recovery_events not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching recovery_events {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Recovery_eventsResponse, status_code=201)
async def create_recovery_events(
    data: Recovery_eventsData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new recovery_events"""
    logger.debug(f"Creating new recovery_events with data: {data}")
    
    service = Recovery_eventsService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create recovery_events")
        
        logger.info(f"Recovery_events created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating recovery_events: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating recovery_events: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Recovery_eventsResponse], status_code=201)
async def create_recovery_eventss_batch(
    request: Recovery_eventsBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple recovery_eventss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} recovery_eventss")
    
    service = Recovery_eventsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} recovery_eventss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Recovery_eventsResponse])
async def update_recovery_eventss_batch(
    request: Recovery_eventsBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple recovery_eventss in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} recovery_eventss")
    
    service = Recovery_eventsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} recovery_eventss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Recovery_eventsResponse)
async def update_recovery_events(
    id: int,
    data: Recovery_eventsUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing recovery_events (requires ownership)"""
    logger.debug(f"Updating recovery_events {id} with data: {data}")

    service = Recovery_eventsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Recovery_events with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Recovery_events not found")
        
        logger.info(f"Recovery_events {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating recovery_events {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating recovery_events {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_recovery_eventss_batch(
    request: Recovery_eventsBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple recovery_eventss by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} recovery_eventss")
    
    service = Recovery_eventsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} recovery_eventss successfully")
        return {"message": f"Successfully deleted {deleted_count} recovery_eventss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_recovery_events(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single recovery_events by ID (requires ownership)"""
    logger.debug(f"Deleting recovery_events with id: {id}")
    
    service = Recovery_eventsService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Recovery_events with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Recovery_events not found")
        
        logger.info(f"Recovery_events {id} deleted successfully")
        return {"message": "Recovery_events deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting recovery_events {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")