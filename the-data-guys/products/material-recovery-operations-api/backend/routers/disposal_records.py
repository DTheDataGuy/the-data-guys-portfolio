import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.disposal_records import Disposal_recordsService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/disposal_records", tags=["disposal_records"])


# ---------- Pydantic Schemas ----------
class Disposal_recordsData(BaseModel):
    """Entity data schema (for create/update)"""
    material_type: str
    disposal_method: str
    weight_tons: float
    cost: float = None
    disposal_date: str
    hauler: str = None
    manifest_number: str = None
    notes: str = None


class Disposal_recordsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    material_type: Optional[str] = None
    disposal_method: Optional[str] = None
    weight_tons: Optional[float] = None
    cost: Optional[float] = None
    disposal_date: Optional[str] = None
    hauler: Optional[str] = None
    manifest_number: Optional[str] = None
    notes: Optional[str] = None


class Disposal_recordsResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    material_type: str
    disposal_method: str
    weight_tons: float
    cost: Optional[float] = None
    disposal_date: str
    hauler: Optional[str] = None
    manifest_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Disposal_recordsListResponse(BaseModel):
    """List response schema"""
    items: List[Disposal_recordsResponse]
    total: int
    skip: int
    limit: int


class Disposal_recordsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Disposal_recordsData]


class Disposal_recordsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Disposal_recordsUpdateData


class Disposal_recordsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Disposal_recordsBatchUpdateItem]


class Disposal_recordsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Disposal_recordsListResponse)
async def query_disposal_recordss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query disposal_recordss with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying disposal_recordss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Disposal_recordsService(db)
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
        logger.debug(f"Found {result['total']} disposal_recordss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying disposal_recordss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Disposal_recordsListResponse)
async def query_disposal_recordss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query disposal_recordss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying disposal_recordss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Disposal_recordsService(db)
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
        logger.debug(f"Found {result['total']} disposal_recordss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying disposal_recordss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Disposal_recordsResponse)
async def get_disposal_records(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single disposal_records by ID (user can only see their own records)"""
    logger.debug(f"Fetching disposal_records with id: {id}, fields={fields}")
    
    service = Disposal_recordsService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Disposal_records with id {id} not found")
            raise HTTPException(status_code=404, detail="Disposal_records not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching disposal_records {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Disposal_recordsResponse, status_code=201)
async def create_disposal_records(
    data: Disposal_recordsData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new disposal_records"""
    logger.debug(f"Creating new disposal_records with data: {data}")
    
    service = Disposal_recordsService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create disposal_records")
        
        logger.info(f"Disposal_records created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating disposal_records: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating disposal_records: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Disposal_recordsResponse], status_code=201)
async def create_disposal_recordss_batch(
    request: Disposal_recordsBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple disposal_recordss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} disposal_recordss")
    
    service = Disposal_recordsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} disposal_recordss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Disposal_recordsResponse])
async def update_disposal_recordss_batch(
    request: Disposal_recordsBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple disposal_recordss in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} disposal_recordss")
    
    service = Disposal_recordsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} disposal_recordss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Disposal_recordsResponse)
async def update_disposal_records(
    id: int,
    data: Disposal_recordsUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing disposal_records (requires ownership)"""
    logger.debug(f"Updating disposal_records {id} with data: {data}")

    service = Disposal_recordsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Disposal_records with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Disposal_records not found")
        
        logger.info(f"Disposal_records {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating disposal_records {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating disposal_records {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_disposal_recordss_batch(
    request: Disposal_recordsBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple disposal_recordss by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} disposal_recordss")
    
    service = Disposal_recordsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} disposal_recordss successfully")
        return {"message": f"Successfully deleted {deleted_count} disposal_recordss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_disposal_records(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single disposal_records by ID (requires ownership)"""
    logger.debug(f"Deleting disposal_records with id: {id}")
    
    service = Disposal_recordsService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Disposal_records with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Disposal_records not found")
        
        logger.info(f"Disposal_records {id} deleted successfully")
        return {"message": "Disposal_records deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting disposal_records {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")