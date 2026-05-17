"""
Router for clinic endpoints
"""
from fastapi import APIRouter, Depends, status
from auth import get_current_user, AuthUser
from services import ClinicService
from schemas import ClinicCreate, ClinicUpdate, ClinicResponse
from typing import List, Optional

router = APIRouter(prefix="/api/clinics", tags=["clinics"])


@router.post("", response_model=ClinicResponse, status_code=status.HTTP_201_CREATED)
async def create_clinic(
    clinic: ClinicCreate,
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Create a new clinic (clinic staff)
    
    - Clinic owner creates clinic account
    - Returns created clinic (initially unapproved)
    - Requires admin approval before visibility
    """
    return await ClinicService.create_clinic(current_user.user_id, clinic)


@router.get("", response_model=List[ClinicResponse])
async def get_approved_clinics():
    """
    Get all approved clinics (public)
    
    - Anyone can view approved clinics
    - Returns clinics sorted by rating
    - No authentication required
    """
    return await ClinicService.get_approved_clinics()


@router.get("/search/location", response_model=List[ClinicResponse])
async def get_clinics_by_location(
    latitude: float,
    longitude: float,
    radius_km: float = 10
):
    """
    Get clinics near location (public)
    
    - Returns approved clinics near given coordinates
    - Radius in kilometers (default: 10km)
    """
    return await ClinicService.get_clinic_by_location(latitude, longitude, radius_km)


@router.get("/{clinic_id}", response_model=ClinicResponse)
async def get_clinic(clinic_id: str):
    """
    Get single clinic details (public)
    
    - Anyone can view clinic details
    - Returns full clinic information
    """
    return await ClinicService.get_clinic(clinic_id)


@router.put("/{clinic_id}", response_model=ClinicResponse)
async def update_clinic(
    clinic_id: str,
    clinic: ClinicUpdate,
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Update clinic (clinic owner only)
    
    - Owner can update their clinic details
    - Can update hours, specializations, contact info, location
    """
    return await ClinicService.update_clinic(clinic_id, current_user.user_id, clinic)


@router.get("/{clinic_id}/dashboard", response_model=ClinicResponse)
async def get_clinic_dashboard(
    clinic_id: str,
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Get clinic dashboard (clinic owner only)
    
    - Owner can view their own clinic dashboard
    - Returns full clinic information for management
    """
    return await ClinicService.get_clinic_by_owner(clinic_id, current_user.user_id)
