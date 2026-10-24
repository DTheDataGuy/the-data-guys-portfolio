import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.recent_searches import Recent_searches

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class Recent_searchesService:
    """Service layer for Recent_searches operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Recent_searches]:
        """Create a new recent_searches"""
        try:
            if user_id:
                data['user_id'] = user_id
            obj = Recent_searches(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created recent_searches with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating recent_searches: {str(e)}")
            raise

    async def check_ownership(self, obj_id: int, user_id: str) -> bool:
        """Check if user owns this record"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            return obj is not None
        except Exception as e:
            logger.error(f"Error checking ownership for recent_searches {obj_id}: {str(e)}")
            return False

    async def get_by_id(self, obj_id: int, user_id: Optional[str] = None) -> Optional[Recent_searches]:
        """Get recent_searches by ID (user can only see their own records)"""
        try:
            query = select(Recent_searches).where(Recent_searches.id == obj_id)
            if user_id:
                query = query.where(Recent_searches.user_id == user_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching recent_searches {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        user_id: Optional[str] = None,
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of recent_searchess (user can only see their own records)"""
        try:
            query = select(Recent_searches)
            count_query = select(func.count(Recent_searches.id))
            
            if user_id:
                query = query.where(Recent_searches.user_id == user_id)
                count_query = count_query.where(Recent_searches.user_id == user_id)
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Recent_searches, field):
                        query = query.where(getattr(Recent_searches, field) == value)
                        count_query = count_query.where(getattr(Recent_searches, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Recent_searches, field_name):
                        query = query.order_by(getattr(Recent_searches, field_name).desc())
                else:
                    if hasattr(Recent_searches, sort):
                        query = query.order_by(getattr(Recent_searches, sort))
            else:
                query = query.order_by(Recent_searches.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching recent_searches list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Recent_searches]:
        """Update recent_searches (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Recent_searches {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key) and key != 'user_id':
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated recent_searches {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating recent_searches {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int, user_id: Optional[str] = None) -> bool:
        """Delete recent_searches (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Recent_searches {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted recent_searches {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting recent_searches {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Recent_searches]:
        """Get recent_searches by any field"""
        try:
            if not hasattr(Recent_searches, field_name):
                raise ValueError(f"Field {field_name} does not exist on Recent_searches")
            result = await self.db.execute(
                select(Recent_searches).where(getattr(Recent_searches, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching recent_searches by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Recent_searches]:
        """Get list of recent_searchess filtered by field"""
        try:
            if not hasattr(Recent_searches, field_name):
                raise ValueError(f"Field {field_name} does not exist on Recent_searches")
            result = await self.db.execute(
                select(Recent_searches)
                .where(getattr(Recent_searches, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Recent_searches.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching recent_searchess by {field_name}: {str(e)}")
            raise