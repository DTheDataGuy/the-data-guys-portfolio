import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.email_preferences import Email_preferencesService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/email_preferences", tags=["email_preferences"])


# ---------- Pydantic Schemas ----------
class Email_preferencesData(BaseModel):
    """Entity data schema (for create/update)"""
    email: str = None
    digest_enabled: bool = None
    include_recovery: bool = None
    include_opportunities: bool = None
    include_financial: bool = None
    frequency: str = None


class Email_preferencesUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    email: Optional[str] = None
    digest_enabled: Optional[bool] = None
    include_recovery: Optional[bool] = None
    include_opportunities: Optional[bool] = None
    include_financial: Optional[bool] = None
    frequency: Optional[str] = None


class Email_preferencesResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    email: Optional[str] = None
    digest_enabled: Optional[bool] = None
    include_recovery: Optional[bool] = None
    include_opportunities: Optional[bool] = None
    include_financial: Optional[bool] = None
    frequency: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Email_preferencesListResponse(BaseModel):
    """List response schema"""
    items: List[Email_preferencesResponse]
    total: int
    skip: int
    limit: int


class Email_preferencesBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Email_preferencesData]


class Email_preferencesBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Email_preferencesUpdateData


class Email_preferencesBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Email_preferencesBatchUpdateItem]


class Email_preferencesBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Email_preferencesListResponse)
async def query_email_preferencess(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query email_preferencess with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying email_preferencess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Email_preferencesService(db)
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
        logger.debug(f"Found {result['total']} email_preferencess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying email_preferencess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Email_preferencesListResponse)
async def query_email_preferencess_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query email_preferencess with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying email_preferencess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Email_preferencesService(db)
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
        logger.debug(f"Found {result['total']} email_preferencess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying email_preferencess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Email_preferencesResponse)
async def get_email_preferences(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single email_preferences by ID (user can only see their own records)"""
    logger.debug(f"Fetching email_preferences with id: {id}, fields={fields}")
    
    service = Email_preferencesService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Email_preferences with id {id} not found")
            raise HTTPException(status_code=404, detail="Email_preferences not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching email_preferences {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Email_preferencesResponse, status_code=201)
async def create_email_preferences(
    data: Email_preferencesData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new email_preferences"""
    logger.debug(f"Creating new email_preferences with data: {data}")
    
    service = Email_preferencesService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create email_preferences")
        
        logger.info(f"Email_preferences created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating email_preferences: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating email_preferences: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Email_preferencesResponse], status_code=201)
async def create_email_preferencess_batch(
    request: Email_preferencesBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple email_preferencess in a single request"""
    logger.debug(f"Batch creating {len(request.items)} email_preferencess")
    
    service = Email_preferencesService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} email_preferencess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Email_preferencesResponse])
async def update_email_preferencess_batch(
    request: Email_preferencesBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple email_preferencess in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} email_preferencess")
    
    service = Email_preferencesService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} email_preferencess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Email_preferencesResponse)
async def update_email_preferences(
    id: int,
    data: Email_preferencesUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing email_preferences (requires ownership)"""
    logger.debug(f"Updating email_preferences {id} with data: {data}")

    service = Email_preferencesService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Email_preferences with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Email_preferences not found")
        
        logger.info(f"Email_preferences {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating email_preferences {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating email_preferences {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_email_preferencess_batch(
    request: Email_preferencesBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple email_preferencess by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} email_preferencess")
    
    service = Email_preferencesService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} email_preferencess successfully")
        return {"message": f"Successfully deleted {deleted_count} email_preferencess", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_email_preferences(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single email_preferences by ID (requires ownership)"""
    logger.debug(f"Deleting email_preferences with id: {id}")
    
    service = Email_preferencesService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Email_preferences with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Email_preferences not found")
        
        logger.info(f"Email_preferences {id} deleted successfully")
        return {"message": "Email_preferences deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting email_preferences {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")