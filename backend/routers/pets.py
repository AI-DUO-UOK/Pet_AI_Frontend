"""
Router for pet endpoints
"""
from fastapi import APIRouter, Depends, status
from auth import get_current_user, AuthUser
from services import PetService
from schemas import PetCreate, PetUpdate, PetResponse
from typing import List

router = APIRouter(prefix="/api/pets", tags=["pets"])


@router.post("", response_model=PetResponse, status_code=status.HTTP_201_CREATED)
async def create_pet(
    pet: PetCreate,
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Create a new pet (owner only)
    
    - Owner creates pet in their account
    - Returns created pet with ID
    """
    return await PetService.create_pet(current_user.user_id, pet)


@router.get("", response_model=List[PetResponse])
async def get_my_pets(
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Get all pets for current user
    
    - Returns all pets owned by current user
    - Sorted by creation date (newest first)
    """
    return await PetService.get_user_pets(current_user.user_id)


@router.get("/{pet_id}", response_model=PetResponse)
async def get_pet(
    pet_id: str,
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Get single pet details
    
    - Returns pet information
    - Owner can always view their own pets
    """
    pet = await PetService.get_pet(pet_id)
    # Verify ownership is checked in update/delete
    return pet


@router.put("/{pet_id}", response_model=PetResponse)
async def update_pet(
    pet_id: str,
    pet: PetUpdate,
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Update pet (owner only)
    
    - Owner can update their own pets
    - Can update name, breed, age, weight, medical history
    """
    return await PetService.update_pet(pet_id, current_user.user_id, pet)


@router.delete("/{pet_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pet(
    pet_id: str,
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Delete pet (owner only)
    
    - Owner can delete their own pets
    - Deletes pet and associated medical records
    """
    await PetService.delete_pet(pet_id, current_user.user_id)
    return None
