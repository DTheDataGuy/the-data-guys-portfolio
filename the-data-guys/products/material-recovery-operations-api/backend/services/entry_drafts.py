import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.entry_drafts import Entry_drafts

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class Entry_draftsService:
    """Service layer for Entry_drafts operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Entry_drafts]:
        """Create a new entry_drafts"""
        try:
            if user_id:
                data['user_id'] = user_id
            obj = Entry_drafts(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created entry_drafts with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating entry_drafts: {str(e)}")
            raise

    async def check_ownership(self, obj_id: int, user_id: str) -> bool:
        """Check if user owns this record"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            return obj is not None
        except Exception as e:
            logger.error(f"Error checking ownership for entry_drafts {obj_id}: {str(e)}")
            return False

    async def get_by_id(self, obj_id: int, user_id: Optional[str] = None) -> Optional[Entry_drafts]:
        """Get entry_drafts by ID (user can only see their own records)"""
        try:
            query = select(Entry_drafts).where(Entry_drafts.id == obj_id)
            if user_id:
                query = query.where(Entry_drafts.user_id == user_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching entry_drafts {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        user_id: Optional[str] = None,
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of entry_draftss (user can only see their own records)"""
        try:
            query = select(Entry_drafts)
            count_query = select(func.count(Entry_drafts.id))
            
            if user_id:
                query = query.where(Entry_drafts.user_id == user_id)
                count_query = count_query.where(Entry_drafts.user_id == user_id)
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Entry_drafts, field):
                        query = query.where(getattr(Entry_drafts, field) == value)
                        count_query = count_query.where(getattr(Entry_drafts, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Entry_drafts, field_name):
                        query = query.order_by(getattr(Entry_drafts, field_name).desc())
                else:
                    if hasattr(Entry_drafts, sort):
                        query = query.order_by(getattr(Entry_drafts, sort))
            else:
                query = query.order_by(Entry_drafts.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching entry_drafts list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Entry_drafts]:
        """Update entry_drafts (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Entry_drafts {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key) and key != 'user_id':
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated entry_drafts {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating entry_drafts {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int, user_id: Optional[str] = None) -> bool:
        """Delete entry_drafts (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Entry_drafts {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted entry_drafts {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting entry_drafts {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Entry_drafts]:
        """Get entry_drafts by any field"""
        try:
            if not hasattr(Entry_drafts, field_name):
                raise ValueError(f"Field {field_name} does not exist on Entry_drafts")
            result = await self.db.execute(
                select(Entry_drafts).where(getattr(Entry_drafts, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching entry_drafts by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Entry_drafts]:
        """Get list of entry_draftss filtered by field"""
        try:
            if not hasattr(Entry_drafts, field_name):
                raise ValueError(f"Field {field_name} does not exist on Entry_drafts")
            result = await self.db.execute(
                select(Entry_drafts)
                .where(getattr(Entry_drafts, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Entry_drafts.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching entry_draftss by {field_name}: {str(e)}")
            raise