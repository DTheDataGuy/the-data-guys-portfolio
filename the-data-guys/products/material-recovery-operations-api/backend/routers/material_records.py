import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.material_records import Material_recordsService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/material_records", tags=["material_records"])


# ---------- Pydantic Schemas ----------
class Material_recordsData(BaseModel):
    """Entity data schema (for create/update)"""
    material_type: str
    category: str = None
    weight_tons: float
    source_project: str = None
    date_received: str
    condition: str = None
    notes: str = None


class Material_recordsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    material_type: Optional[str] = None
    category: Optional[str] = None
    weight_tons: Optional[float] = None
    source_project: Optional[str] = None
    date_received: Optional[str] = None
    condition: Optional[str] = None
    notes: Optional[str] = None


class Material_recordsResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    material_type: str
    category: Optional[str] = None
    weight_tons: float
    source_project: Optional[str] = None
    date_received: str
    condition: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Material_recordsListResponse(BaseModel):
    """List response schema"""
    items: List[Material_recordsResponse]
    total: int
    skip: int
    limit: int


class Material_recordsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Material_recordsData]


class Material_recordsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Material_recordsUpdateData


class Material_recordsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Material_recordsBatchUpdateItem]


class Material_recordsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Material_recordsListResponse)
async def query_material_recordss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query material_recordss with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying material_recordss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Material_recordsService(db)
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
        logger.debug(f"Found {result['total']} material_recordss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying material_recordss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Material_recordsListResponse)
async def query_material_recordss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query material_recordss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying material_recordss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Material_recordsService(db)
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
        logger.debug(f"Found {result['total']} material_recordss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying material_recordss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Material_recordsResponse)
async def get_material_records(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single material_records by ID (user can only see their own records)"""
    logger.debug(f"Fetching material_records with id: {id}, fields={fields}")
    
    service = Material_recordsService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Material_records with id {id} not found")
            raise HTTPException(status_code=404, detail="Material_records not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching material_records {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Material_recordsResponse, status_code=201)
async def create_material_records(
    data: Material_recordsData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new material_records"""
    logger.debug(f"Creating new material_records with data: {data}")
    
    service = Material_recordsService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create material_records")
        
        logger.info(f"Material_records created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating material_records: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating material_records: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Material_recordsResponse], status_code=201)
async def create_material_recordss_batch(
    request: Material_recordsBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple material_recordss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} material_recordss")
    
    service = Material_recordsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} material_recordss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Material_recordsResponse])
async def update_material_recordss_batch(
    request: Material_recordsBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple material_recordss in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} material_recordss")
    
    service = Material_recordsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} material_recordss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Material_recordsResponse)
async def update_material_records(
    id: int,
    data: Material_recordsUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing material_records (requires ownership)"""
    logger.debug(f"Updating material_records {id} with data: {data}")

    service = Material_recordsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Material_records with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Material_records not found")
        
        logger.info(f"Material_records {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating material_records {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating material_records {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_material_recordss_batch(
    request: Material_recordsBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple material_recordss by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} material_recordss")
    
    service = Material_recordsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} material_recordss successfully")
        return {"message": f"Successfully deleted {deleted_count} material_recordss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_material_records(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single material_records by ID (requires ownership)"""
    logger.debug(f"Deleting material_records with id: {id}")
    
    service = Material_recordsService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Material_records with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Material_records not found")
        
        logger.info(f"Material_records {id} deleted successfully")
        return {"message": "Material_records deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting material_records {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")