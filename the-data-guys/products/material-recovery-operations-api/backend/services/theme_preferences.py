import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.theme_preferences import Theme_preferences

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class Theme_preferencesService:
    """Service layer for Theme_preferences operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Theme_preferences]:
        """Create a new theme_preferences"""
        try:
            if user_id:
                data['user_id'] = user_id
            obj = Theme_preferences(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created theme_preferences with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating theme_preferences: {str(e)}")
            raise

    async def check_ownership(self, obj_id: int, user_id: str) -> bool:
        """Check if user owns this record"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            return obj is not None
        except Exception as e:
            logger.error(f"Error checking ownership for theme_preferences {obj_id}: {str(e)}")
            return False

    async def get_by_id(self, obj_id: int, user_id: Optional[str] = None) -> Optional[Theme_preferences]:
        """Get theme_preferences by ID (user can only see their own records)"""
        try:
            query = select(Theme_preferences).where(Theme_preferences.id == obj_id)
            if user_id:
                query = query.where(Theme_preferences.user_id == user_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching theme_preferences {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        user_id: Optional[str] = None,
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of theme_preferencess (user can only see their own records)"""
        try:
            query = select(Theme_preferences)
            count_query = select(func.count(Theme_preferences.id))
            
            if user_id:
                query = query.where(Theme_preferences.user_id == user_id)
                count_query = count_query.where(Theme_preferences.user_id == user_id)
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Theme_preferences, field):
                        query = query.where(getattr(Theme_preferences, field) == value)
                        count_query = count_query.where(getattr(Theme_preferences, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Theme_preferences, field_name):
                        query = query.order_by(getattr(Theme_preferences, field_name).desc())
                else:
                    if hasattr(Theme_preferences, sort):
                        query = query.order_by(getattr(Theme_preferences, sort))
            else:
                query = query.order_by(Theme_preferences.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching theme_preferences list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Theme_preferences]:
        """Update theme_preferences (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Theme_preferences {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key) and key != 'user_id':
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated theme_preferences {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating theme_preferences {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int, user_id: Optional[str] = None) -> bool:
        """Delete theme_preferences (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Theme_preferences {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted theme_preferences {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting theme_preferences {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Theme_preferences]:
        """Get theme_preferences by any field"""
        try:
            if not hasattr(Theme_preferences, field_name):
                raise ValueError(f"Field {field_name} does not exist on Theme_preferences")
            result = await self.db.execute(
                select(Theme_preferences).where(getattr(Theme_preferences, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching theme_preferences by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Theme_preferences]:
        """Get list of theme_preferencess filtered by field"""
        try:
            if not hasattr(Theme_preferences, field_name):
                raise ValueError(f"Field {field_name} does not exist on Theme_preferences")
            result = await self.db.execute(
                select(Theme_preferences)
                .where(getattr(Theme_preferences, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Theme_preferences.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching theme_preferencess by {field_name}: {str(e)}")
            raise