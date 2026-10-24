import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.onboarding_preferences import Onboarding_preferences

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class Onboarding_preferencesService:
    """Service layer for Onboarding_preferences operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Onboarding_preferences]:
        """Create a new onboarding_preferences"""
        try:
            if user_id:
                data['user_id'] = user_id
            obj = Onboarding_preferences(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created onboarding_preferences with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating onboarding_preferences: {str(e)}")
            raise

    async def check_ownership(self, obj_id: int, user_id: str) -> bool:
        """Check if user owns this record"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            return obj is not None
        except Exception as e:
            logger.error(f"Error checking ownership for onboarding_preferences {obj_id}: {str(e)}")
            return False

    async def get_by_id(self, obj_id: int, user_id: Optional[str] = None) -> Optional[Onboarding_preferences]:
        """Get onboarding_preferences by ID (user can only see their own records)"""
        try:
            query = select(Onboarding_preferences).where(Onboarding_preferences.id == obj_id)
            if user_id:
                query = query.where(Onboarding_preferences.user_id == user_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching onboarding_preferences {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        user_id: Optional[str] = None,
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of onboarding_preferencess (user can only see their own records)"""
        try:
            query = select(Onboarding_preferences)
            count_query = select(func.count(Onboarding_preferences.id))
            
            if user_id:
                query = query.where(Onboarding_preferences.user_id == user_id)
                count_query = count_query.where(Onboarding_preferences.user_id == user_id)
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Onboarding_preferences, field):
                        query = query.where(getattr(Onboarding_preferences, field) == value)
                        count_query = count_query.where(getattr(Onboarding_preferences, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Onboarding_preferences, field_name):
                        query = query.order_by(getattr(Onboarding_preferences, field_name).desc())
                else:
                    if hasattr(Onboarding_preferences, sort):
                        query = query.order_by(getattr(Onboarding_preferences, sort))
            else:
                query = query.order_by(Onboarding_preferences.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching onboarding_preferences list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Onboarding_preferences]:
        """Update onboarding_preferences (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Onboarding_preferences {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key) and key != 'user_id':
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated onboarding_preferences {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating onboarding_preferences {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int, user_id: Optional[str] = None) -> bool:
        """Delete onboarding_preferences (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Onboarding_preferences {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted onboarding_preferences {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting onboarding_preferences {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Onboarding_preferences]:
        """Get onboarding_preferences by any field"""
        try:
            if not hasattr(Onboarding_preferences, field_name):
                raise ValueError(f"Field {field_name} does not exist on Onboarding_preferences")
            result = await self.db.execute(
                select(Onboarding_preferences).where(getattr(Onboarding_preferences, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching onboarding_preferences by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Onboarding_preferences]:
        """Get list of onboarding_preferencess filtered by field"""
        try:
            if not hasattr(Onboarding_preferences, field_name):
                raise ValueError(f"Field {field_name} does not exist on Onboarding_preferences")
            result = await self.db.execute(
                select(Onboarding_preferences)
                .where(getattr(Onboarding_preferences, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Onboarding_preferences.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching onboarding_preferencess by {field_name}: {str(e)}")
            raise