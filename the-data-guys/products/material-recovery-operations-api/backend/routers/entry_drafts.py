import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.entry_drafts import Entry_draftsService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/entry_drafts", tags=["entry_drafts"])


# ---------- Pydantic Schemas ----------
class Entry_draftsData(BaseModel):
    """Entity data schema (for create/update)"""
    form_type: str
    form_data: str
    is_active: bool = None


class Entry_draftsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    form_type: Optional[str] = None
    form_data: Optional[str] = None
    is_active: Optional[bool] = None


class Entry_draftsResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    form_type: str
    form_data: str
    is_active: Optional[bool] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Entry_draftsListResponse(BaseModel):
    """List response schema"""
    items: List[Entry_draftsResponse]
    total: int
    skip: int
    limit: int


class Entry_draftsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Entry_draftsData]


class Entry_draftsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Entry_draftsUpdateData


class Entry_draftsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Entry_draftsBatchUpdateItem]


class Entry_draftsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Entry_draftsListResponse)
async def query_entry_draftss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query entry_draftss with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying entry_draftss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Entry_draftsService(db)
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
        logger.debug(f"Found {result['total']} entry_draftss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying entry_draftss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Entry_draftsListResponse)
async def query_entry_draftss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query entry_draftss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying entry_draftss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Entry_draftsService(db)
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
        logger.debug(f"Found {result['total']} entry_draftss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying entry_draftss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Entry_draftsResponse)
async def get_entry_drafts(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single entry_drafts by ID (user can only see their own records)"""
    logger.debug(f"Fetching entry_drafts with id: {id}, fields={fields}")
    
    service = Entry_draftsService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Entry_drafts with id {id} not found")
            raise HTTPException(status_code=404, detail="Entry_drafts not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching entry_drafts {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Entry_draftsResponse, status_code=201)
async def create_entry_drafts(
    data: Entry_draftsData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new entry_drafts"""
    logger.debug(f"Creating new entry_drafts with data: {data}")
    
    service = Entry_draftsService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create entry_drafts")
        
        logger.info(f"Entry_drafts created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating entry_drafts: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating entry_drafts: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Entry_draftsResponse], status_code=201)
async def create_entry_draftss_batch(
    request: Entry_draftsBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple entry_draftss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} entry_draftss")
    
    service = Entry_draftsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} entry_draftss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Entry_draftsResponse])
async def update_entry_draftss_batch(
    request: Entry_draftsBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple entry_draftss in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} entry_draftss")
    
    service = Entry_draftsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} entry_draftss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Entry_draftsResponse)
async def update_entry_drafts(
    id: int,
    data: Entry_draftsUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing entry_drafts (requires ownership)"""
    logger.debug(f"Updating entry_drafts {id} with data: {data}")

    service = Entry_draftsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Entry_drafts with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Entry_drafts not found")
        
        logger.info(f"Entry_drafts {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating entry_drafts {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating entry_drafts {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_entry_draftss_batch(
    request: Entry_draftsBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple entry_draftss by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} entry_draftss")
    
    service = Entry_draftsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} entry_draftss successfully")
        return {"message": f"Successfully deleted {deleted_count} entry_draftss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_entry_drafts(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single entry_drafts by ID (requires ownership)"""
    logger.debug(f"Deleting entry_drafts with id: {id}")
    
    service = Entry_draftsService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Entry_drafts with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Entry_drafts not found")
        
        logger.info(f"Entry_drafts {id} deleted successfully")
        return {"message": "Entry_drafts deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting entry_drafts {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")