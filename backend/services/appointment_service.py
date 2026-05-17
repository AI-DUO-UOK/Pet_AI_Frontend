"""
Services for appointment management
"""
from database import get_db
from schemas import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from fastapi import HTTPException, status
from typing import List
import logging

logger = logging.getLogger(__name__)


class AppointmentService:
    """Service for appointment operations"""
    
    @staticmethod
    async def create_appointment(
        user_id: str,
        appointment: AppointmentCreate
    ) -> AppointmentResponse:
        """
        Create a new appointment
        
        Args:
            user_id: Owner user ID (from JWT)
            appointment: Appointment data
            
        Returns:
            Created appointment
            
        Raises:
            HTTPException: If pet not found or not owned by user
        """
        db = get_db()
        
        # Validate pet exists and belongs to user
        pet_result = db.table("pets").select("*").eq("id", appointment.pet_id).execute()
        if not pet_result.data or pet_result.data[0]["owner_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found or not owned by you"
            )
        
        # Validate clinic exists
        clinic_result = db.table("clinics").select("*").eq("id", appointment.clinic_id).execute()
        if not clinic_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Clinic not found"
            )
        
        # Create appointment
        appointment_data = {
            "pet_id": appointment.pet_id,
            "clinic_id": appointment.clinic_id,
            "owner_id": user_id,
            "appointment_date": appointment.appointment_date,
            "reason": appointment.reason,
            "notes": appointment.notes,
            "status": "pending"
        }
        
        result = db.table("appointments").insert(appointment_data).execute()
        
        if not result.data:
            logger.error(f"Failed to create appointment for user {user_id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create appointment"
            )
        
        return AppointmentResponse(**result.data[0])
    
    @staticmethod
    async def get_user_appointments(user_id: str) -> List[AppointmentResponse]:
        """
        Get all appointments for a user (owner)
        
        Args:
            user_id: Owner user ID
            
        Returns:
            List of appointments
        """
        db = get_db()
        
        result = db.table("appointments")\
            .select("*")\
            .eq("owner_id", user_id)\
            .order("appointment_date", desc=False)\
            .execute()
        
        return [AppointmentResponse(**appt) for appt in result.data]
    
    @staticmethod
    async def get_clinic_appointments(clinic_id: str) -> List[AppointmentResponse]:
        """
        Get all appointments for a clinic
        
        Args:
            clinic_id: Clinic ID
            
        Returns:
            List of appointments
        """
        db = get_db()
        
        result = db.table("appointments")\
            .select("*")\
            .eq("clinic_id", clinic_id)\
            .order("appointment_date", desc=False)\
            .execute()
        
        return [AppointmentResponse(**appt) for appt in result.data]
    
    @staticmethod
    async def get_appointment(appointment_id: str) -> AppointmentResponse:
        """
        Get single appointment
        
        Args:
            appointment_id: Appointment ID
            
        Returns:
            Appointment data
        """
        db = get_db()
        
        result = db.table("appointments")\
            .select("*")\
            .eq("id", appointment_id)\
            .single()\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
        
        return AppointmentResponse(**result.data)
    
    @staticmethod
    async def update_appointment(
        appointment_id: str,
        clinic_id: str,
        update_data: AppointmentUpdate
    ) -> AppointmentResponse:
        """
        Update appointment (clinic only)
        
        Args:
            appointment_id: Appointment ID
            clinic_id: Clinic ID (for validation)
            update_data: Update data
            
        Returns:
            Updated appointment
        """
        db = get_db()
        
        # Get appointment and verify it belongs to clinic
        appointment = await AppointmentService.get_appointment(appointment_id)
        if appointment.clinic_id != clinic_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot update this appointment"
            )
        
        # Prepare update data
        update_dict = update_data.model_dump(exclude_unset=True)
        update_dict["updated_at"] = "now()"  # Let database handle timestamp
        
        result = db.table("appointments")\
            .update(update_dict)\
            .eq("id", appointment_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update appointment"
            )
        
        return AppointmentResponse(**result.data[0])
    
    @staticmethod
    async def cancel_appointment(appointment_id: str, user_id: str) -> AppointmentResponse:
        """
        Cancel appointment (owner only)
        
        Args:
            appointment_id: Appointment ID
            user_id: Owner user ID
            
        Returns:
            Cancelled appointment
        """
        db = get_db()
        
        # Get appointment and verify ownership
        appointment = await AppointmentService.get_appointment(appointment_id)
        if appointment.owner_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot cancel this appointment"
            )
        
        # Update status to cancelled
        result = db.table("appointments")\
            .update({"status": "cancelled"})\
            .eq("id", appointment_id)\
            .execute()
        
        return AppointmentResponse(**result.data[0])
