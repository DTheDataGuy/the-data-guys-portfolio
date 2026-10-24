import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.recent_searches import Recent_searchesService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/recent_searches", tags=["recent_searches"])


# ---------- Pydantic Schemas ----------
class Recent_searchesData(BaseModel):
    """Entity data schema (for create/update)"""
    query: str
    category: str = None


class Recent_searchesUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    query: Optional[str] = None
    category: Optional[str] = None


class Recent_searchesResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    query: str
    category: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Recent_searchesListResponse(BaseModel):
    """List response schema"""
    items: List[Recent_searchesResponse]
    total: int
    skip: int
    limit: int


class Recent_searchesBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Recent_searchesData]


class Recent_searchesBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Recent_searchesUpdateData


class Recent_searchesBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Recent_searchesBatchUpdateItem]


class Recent_searchesBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Recent_searchesListResponse)
async def query_recent_searchess(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query recent_searchess with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying recent_searchess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Recent_searchesService(db)
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
        logger.debug(f"Found {result['total']} recent_searchess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying recent_searchess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Recent_searchesListResponse)
async def query_recent_searchess_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query recent_searchess with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying recent_searchess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Recent_searchesService(db)
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
        logger.debug(f"Found {result['total']} recent_searchess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying recent_searchess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Recent_searchesResponse)
async def get_recent_searches(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single recent_searches by ID (user can only see their own records)"""
    logger.debug(f"Fetching recent_searches with id: {id}, fields={fields}")
    
    service = Recent_searchesService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Recent_searches with id {id} not found")
            raise HTTPException(status_code=404, detail="Recent_searches not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching recent_searches {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Recent_searchesResponse, status_code=201)
async def create_recent_searches(
    data: Recent_searchesData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new recent_searches"""
    logger.debug(f"Creating new recent_searches with data: {data}")
    
    service = Recent_searchesService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create recent_searches")
        
        logger.info(f"Recent_searches created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating recent_searches: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating recent_searches: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Recent_searchesResponse], status_code=201)
async def create_recent_searchess_batch(
    request: Recent_searchesBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple recent_searchess in a single request"""
    logger.debug(f"Batch creating {len(request.items)} recent_searchess")
    
    service = Recent_searchesService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} recent_searchess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Recent_searchesResponse])
async def update_recent_searchess_batch(
    request: Recent_searchesBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple recent_searchess in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} recent_searchess")
    
    service = Recent_searchesService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} recent_searchess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Recent_searchesResponse)
async def update_recent_searches(
    id: int,
    data: Recent_searchesUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing recent_searches (requires ownership)"""
    logger.debug(f"Updating recent_searches {id} with data: {data}")

    service = Recent_searchesService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Recent_searches with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Recent_searches not found")
        
        logger.info(f"Recent_searches {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating recent_searches {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating recent_searches {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_recent_searchess_batch(
    request: Recent_searchesBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple recent_searchess by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} recent_searchess")
    
    service = Recent_searchesService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} recent_searchess successfully")
        return {"message": f"Successfully deleted {deleted_count} recent_searchess", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_recent_searches(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single recent_searches by ID (requires ownership)"""
    logger.debug(f"Deleting recent_searches with id: {id}")
    
    service = Recent_searchesService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Recent_searches with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Recent_searches not found")
        
        logger.info(f"Recent_searches {id} deleted successfully")
        return {"message": "Recent_searches deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting recent_searches {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")