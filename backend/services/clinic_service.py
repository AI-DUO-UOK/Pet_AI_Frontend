"""
Services for clinic management
"""
from database import get_db
from schemas import ClinicCreate, ClinicUpdate, ClinicResponse
from fastapi import HTTPException, status
from typing import List
import logging

logger = logging.getLogger(__name__)


class ClinicService:
    """Service for clinic operations"""
    
    @staticmethod
    async def create_clinic(user_id: str, clinic: ClinicCreate) -> ClinicResponse:
        """
        Create a new clinic
        
        Args:
            user_id: Clinic owner user ID
            clinic: Clinic data
            
        Returns:
            Created clinic
        """
        db = get_db()
        
        clinic_data = {
            "owner_id": user_id,
            **clinic.model_dump(),
            "is_approved": False  # Clinics start unapproved
        }
        
        result = db.table("clinics").insert(clinic_data).execute()
        
        if not result.data:
            logger.error(f"Failed to create clinic for user {user_id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create clinic"
            )
        
        return ClinicResponse(**result.data[0])
    
    @staticmethod
    async def get_approved_clinics() -> List[ClinicResponse]:
        """
        Get all approved clinics (public list)
        
        Returns:
            List of approved clinics
        """
        db = get_db()
        
        result = db.table("clinics")\
            .select("*")\
            .eq("is_approved", True)\
            .order("rating", desc=True)\
            .execute()
        
        return [ClinicResponse(**clinic) for clinic in result.data]
    
    @staticmethod
    async def get_clinic_by_location(
        latitude: float,
        longitude: float,
        radius_km: float = 10
    ) -> List[ClinicResponse]:
        """
        Get clinics near location (using Supabase PostGIS)
        
        Args:
            latitude: User latitude
            longitude: User longitude
            radius_km: Search radius in kilometers
            
        Returns:
            List of nearby clinics
        """
        # Note: This requires PostGIS in Supabase
        # For now, fetch all and filter in Python or frontend
        db = get_db()
        
        result = db.table("clinics")\
            .select("*")\
            .eq("is_approved", True)\
            .execute()
        
        return [ClinicResponse(**clinic) for clinic in result.data]
    
    @staticmethod
    async def get_clinic(clinic_id: str) -> ClinicResponse:
        """
        Get single clinic
        
        Args:
            clinic_id: Clinic ID
            
        Returns:
            Clinic data
        """
        db = get_db()
        
        result = db.table("clinics")\
            .select("*")\
            .eq("id", clinic_id)\
            .single()\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Clinic not found"
            )
        
        return ClinicResponse(**result.data)
    
    @staticmethod
    async def get_clinic_by_owner(clinic_id: str, user_id: str) -> ClinicResponse:
        """
        Get clinic (verify ownership)
        
        Args:
            clinic_id: Clinic ID
            user_id: Owner user ID
            
        Returns:
            Clinic data
        """
        clinic = await ClinicService.get_clinic(clinic_id)
        if clinic.owner_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot access this clinic"
            )
        return clinic
    
    @staticmethod
    async def update_clinic(
        clinic_id: str,
        user_id: str,
        clinic: ClinicUpdate
    ) -> ClinicResponse:
        """
        Update clinic (owner only)
        
        Args:
            clinic_id: Clinic ID
            user_id: Owner user ID
            clinic: Updated clinic data
            
        Returns:
            Updated clinic
        """
        db = get_db()
        
        # Verify ownership
        existing_clinic = await ClinicService.get_clinic_by_owner(clinic_id, user_id)
        
        # Update clinic
        update_data = clinic.model_dump(exclude_unset=True)
        result = db.table("clinics")\
            .update(update_data)\
            .eq("id", clinic_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update clinic"
            )
        
        return ClinicResponse(**result.data[0])
    
    @staticmethod
    async def approve_clinic(clinic_id: str) -> ClinicResponse:
        """
        Approve clinic (admin only)
        
        Args:
            clinic_id: Clinic ID
            
        Returns:
            Updated clinic
        """
        db = get_db()
        
        result = db.table("clinics")\
            .update({"is_approved": True})\
            .eq("id", clinic_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to approve clinic"
            )
        
        return ClinicResponse(**result.data[0])
