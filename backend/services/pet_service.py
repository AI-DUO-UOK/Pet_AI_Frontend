"""
Services for pet management
"""
from database import get_db
from schemas import PetCreate, PetUpdate, PetResponse
from fastapi import HTTPException, status
from typing import List
import logging

logger = logging.getLogger(__name__)


class PetService:
    """Service for pet operations"""
    
    @staticmethod
    async def create_pet(user_id: str, pet: PetCreate) -> PetResponse:
        """
        Create a new pet
        
        Args:
            user_id: Owner user ID
            pet: Pet data
            
        Returns:
            Created pet
        """
        db = get_db()
        
        pet_data = {
            "owner_id": user_id,
            **pet.model_dump()
        }
        
        result = db.table("pets").insert(pet_data).execute()
        
        if not result.data:
            logger.error(f"Failed to create pet for user {user_id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create pet"
            )
        
        return PetResponse(**result.data[0])
    
    @staticmethod
    async def get_user_pets(user_id: str) -> List[PetResponse]:
        """
        Get all pets for a user
        
        Args:
            user_id: Owner user ID
            
        Returns:
            List of pets
        """
        db = get_db()
        
        result = db.table("pets")\
            .select("*")\
            .eq("owner_id", user_id)\
            .order("created_at", desc=True)\
            .execute()
        
        return [PetResponse(**pet) for pet in result.data]
    
    @staticmethod
    async def get_pet(pet_id: str) -> PetResponse:
        """
        Get single pet
        
        Args:
            pet_id: Pet ID
            
        Returns:
            Pet data
        """
        db = get_db()
        
        result = db.table("pets")\
            .select("*")\
            .eq("id", pet_id)\
            .single()\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found"
            )
        
        return PetResponse(**result.data)
    
    @staticmethod
    async def update_pet(pet_id: str, user_id: str, pet: PetUpdate) -> PetResponse:
        """
        Update pet (owner only)
        
        Args:
            pet_id: Pet ID
            user_id: Owner user ID
            pet: Updated pet data
            
        Returns:
            Updated pet
        """
        db = get_db()
        
        # Verify ownership
        existing_pet = await PetService.get_pet(pet_id)
        if existing_pet.owner_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot update this pet"
            )
        
        # Update pet
        update_data = pet.model_dump(exclude_unset=True)
        result = db.table("pets")\
            .update(update_data)\
            .eq("id", pet_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update pet"
            )
        
        return PetResponse(**result.data[0])
    
    @staticmethod
    async def delete_pet(pet_id: str, user_id: str) -> dict:
        """
        Delete pet (owner only)
        
        Args:
            pet_id: Pet ID
            user_id: Owner user ID
            
        Returns:
            Success message
        """
        db = get_db()
        
        # Verify ownership
        pet = await PetService.get_pet(pet_id)
        if pet.owner_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot delete this pet"
            )
        
        # Delete pet
        result = db.table("pets")\
            .delete()\
            .eq("id", pet_id)\
            .execute()
        
        return {"message": "Pet deleted successfully"}
