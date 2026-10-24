import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.activity_logs import Activity_logsService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/activity_logs", tags=["activity_logs"])


# ---------- Pydantic Schemas ----------
class Activity_logsData(BaseModel):
    """Entity data schema (for create/update)"""
    action_type: str
    record_type: str
    record_id: str
    material_type: str = None
    details: str = None
    timestamp: str


class Activity_logsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    action_type: Optional[str] = None
    record_type: Optional[str] = None
    record_id: Optional[str] = None
    material_type: Optional[str] = None
    details: Optional[str] = None
    timestamp: Optional[str] = None


class Activity_logsResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    action_type: str
    record_type: str
    record_id: str
    material_type: Optional[str] = None
    details: Optional[str] = None
    timestamp: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Activity_logsListResponse(BaseModel):
    """List response schema"""
    items: List[Activity_logsResponse]
    total: int
    skip: int
    limit: int


class Activity_logsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Activity_logsData]


class Activity_logsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Activity_logsUpdateData


class Activity_logsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Activity_logsBatchUpdateItem]


class Activity_logsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Activity_logsListResponse)
async def query_activity_logss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query activity_logss with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying activity_logss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Activity_logsService(db)
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
        logger.debug(f"Found {result['total']} activity_logss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying activity_logss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Activity_logsListResponse)
async def query_activity_logss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query activity_logss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying activity_logss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Activity_logsService(db)
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
        logger.debug(f"Found {result['total']} activity_logss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying activity_logss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Activity_logsResponse)
async def get_activity_logs(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single activity_logs by ID (user can only see their own records)"""
    logger.debug(f"Fetching activity_logs with id: {id}, fields={fields}")
    
    service = Activity_logsService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Activity_logs with id {id} not found")
            raise HTTPException(status_code=404, detail="Activity_logs not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching activity_logs {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Activity_logsResponse, status_code=201)
async def create_activity_logs(
    data: Activity_logsData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new activity_logs"""
    logger.debug(f"Creating new activity_logs with data: {data}")
    
    service = Activity_logsService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create activity_logs")
        
        logger.info(f"Activity_logs created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating activity_logs: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating activity_logs: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Activity_logsResponse], status_code=201)
async def create_activity_logss_batch(
    request: Activity_logsBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple activity_logss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} activity_logss")
    
    service = Activity_logsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} activity_logss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Activity_logsResponse])
async def update_activity_logss_batch(
    request: Activity_logsBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple activity_logss in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} activity_logss")
    
    service = Activity_logsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} activity_logss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Activity_logsResponse)
async def update_activity_logs(
    id: int,
    data: Activity_logsUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing activity_logs (requires ownership)"""
    logger.debug(f"Updating activity_logs {id} with data: {data}")

    service = Activity_logsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Activity_logs with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Activity_logs not found")
        
        logger.info(f"Activity_logs {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating activity_logs {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating activity_logs {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_activity_logss_batch(
    request: Activity_logsBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple activity_logss by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} activity_logss")
    
    service = Activity_logsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} activity_logss successfully")
        return {"message": f"Successfully deleted {deleted_count} activity_logss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_activity_logs(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single activity_logs by ID (requires ownership)"""
    logger.debug(f"Deleting activity_logs with id: {id}")
    
    service = Activity_logsService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Activity_logs with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Activity_logs not found")
        
        logger.info(f"Activity_logs {id} deleted successfully")
        return {"message": "Activity_logs deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting activity_logs {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")