"""
Router for appointment endpoints
"""
from fastapi import APIRouter, Depends, status
from auth import get_current_user, AuthUser
from services import AppointmentService
from schemas import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from typing import List

router = APIRouter(prefix="/api/appointments", tags=["appointments"])


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment: AppointmentCreate,
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Create a new appointment (owner only)
    
    - Owner creates appointment for their pet at a clinic
    - Returns created appointment with ID
    """
    return await AppointmentService.create_appointment(current_user.user_id, appointment)


@router.get("/my", response_model=List[AppointmentResponse])
async def get_my_appointments(
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Get all appointments for current user (owner)
    
    - Returns appointments sorted by date
    - Only shows appointments owned by current user
    """
    return await AppointmentService.get_user_appointments(current_user.user_id)


@router.get("/clinic", response_model=List[AppointmentResponse])
async def get_clinic_appointments(
    clinic_id: str,
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Get all appointments for a clinic (clinic staff only)
    
    - Returns appointments sorted by date
    - Clinic must verify ownership (todo: add clinic verification)
    """
    return await AppointmentService.get_clinic_appointments(clinic_id)


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: str,
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Get single appointment details
    
    - Owner or clinic staff can view
    - Returns full appointment details
    """
    return await AppointmentService.get_appointment(appointment_id)


@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: str,
    update_data: AppointmentUpdate,
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Update appointment (clinic staff only)
    
    - Add diagnosis, notes, prescription
    - Update appointment status
    - Only clinic owner can update
    """
    # Note: Need to verify clinic ownership
    # For now, just pass clinic_id as current_user (needs refactor for multi-clinic support)
    return await AppointmentService.update_appointment(
        appointment_id,
        current_user.user_id,
        update_data
    )


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_appointment(
    appointment_id: str,
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Cancel appointment (owner only)
    
    - Sets appointment status to 'cancelled'
    - Only owner can cancel
    """
    await AppointmentService.cancel_appointment(appointment_id, current_user.user_id)
    return None
