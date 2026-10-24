import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.theme_preferences import Theme_preferencesService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/theme_preferences", tags=["theme_preferences"])


# ---------- Pydantic Schemas ----------
class Theme_preferencesData(BaseModel):
    """Entity data schema (for create/update)"""
    theme: str = None


class Theme_preferencesUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    theme: Optional[str] = None


class Theme_preferencesResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    theme: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Theme_preferencesListResponse(BaseModel):
    """List response schema"""
    items: List[Theme_preferencesResponse]
    total: int
    skip: int
    limit: int


class Theme_preferencesBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Theme_preferencesData]


class Theme_preferencesBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Theme_preferencesUpdateData


class Theme_preferencesBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Theme_preferencesBatchUpdateItem]


class Theme_preferencesBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Theme_preferencesListResponse)
async def query_theme_preferencess(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query theme_preferencess with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying theme_preferencess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Theme_preferencesService(db)
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
        logger.debug(f"Found {result['total']} theme_preferencess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying theme_preferencess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Theme_preferencesListResponse)
async def query_theme_preferencess_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query theme_preferencess with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying theme_preferencess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Theme_preferencesService(db)
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
        logger.debug(f"Found {result['total']} theme_preferencess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying theme_preferencess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Theme_preferencesResponse)
async def get_theme_preferences(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single theme_preferences by ID (user can only see their own records)"""
    logger.debug(f"Fetching theme_preferences with id: {id}, fields={fields}")
    
    service = Theme_preferencesService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Theme_preferences with id {id} not found")
            raise HTTPException(status_code=404, detail="Theme_preferences not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching theme_preferences {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Theme_preferencesResponse, status_code=201)
async def create_theme_preferences(
    data: Theme_preferencesData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new theme_preferences"""
    logger.debug(f"Creating new theme_preferences with data: {data}")
    
    service = Theme_preferencesService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create theme_preferences")
        
        logger.info(f"Theme_preferences created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating theme_preferences: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating theme_preferences: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Theme_preferencesResponse], status_code=201)
async def create_theme_preferencess_batch(
    request: Theme_preferencesBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple theme_preferencess in a single request"""
    logger.debug(f"Batch creating {len(request.items)} theme_preferencess")
    
    service = Theme_preferencesService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} theme_preferencess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Theme_preferencesResponse])
async def update_theme_preferencess_batch(
    request: Theme_preferencesBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple theme_preferencess in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} theme_preferencess")
    
    service = Theme_preferencesService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} theme_preferencess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Theme_preferencesResponse)
async def update_theme_preferences(
    id: int,
    data: Theme_preferencesUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing theme_preferences (requires ownership)"""
    logger.debug(f"Updating theme_preferences {id} with data: {data}")

    service = Theme_preferencesService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Theme_preferences with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Theme_preferences not found")
        
        logger.info(f"Theme_preferences {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating theme_preferences {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating theme_preferences {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_theme_preferencess_batch(
    request: Theme_preferencesBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple theme_preferencess by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} theme_preferencess")
    
    service = Theme_preferencesService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} theme_preferencess successfully")
        return {"message": f"Successfully deleted {deleted_count} theme_preferencess", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_theme_preferences(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single theme_preferences by ID (requires ownership)"""
    logger.debug(f"Deleting theme_preferences with id: {id}")
    
    service = Theme_preferencesService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Theme_preferences with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Theme_preferences not found")
        
        logger.info(f"Theme_preferences {id} deleted successfully")
        return {"message": "Theme_preferences deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting theme_preferences {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")