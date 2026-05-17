"""
Pydantic models for data validation
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ==================== ENUMS ====================

class AppointmentStatus(str, Enum):
    """Appointment status enum"""
    pending = "pending"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"
    no_show = "no_show"


class UserRole(str, Enum):
    """User role enum"""
    owner = "owner"
    clinic = "clinic"
    admin = "admin"


# ==================== AUTH ====================

class SignupRequest(BaseModel):
    """User signup request"""
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str
    role: UserRole = UserRole.owner


class LoginRequest(BaseModel):
    """User login request"""
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    """Authentication response"""
    access_token: str
    refresh_token: Optional[str] = None
    user_id: str
    email: str
    role: UserRole


# ==================== PETS ====================

class PetCreate(BaseModel):
    """Create pet request"""
    name: str = Field(..., min_length=1, max_length=100)
    species: str = Field(..., pattern="^(dog|cat|rabbit|bird|other)$")
    breed: str = Field(..., min_length=1, max_length=100)
    age: float = Field(..., gt=0)
    weight: float = Field(..., gt=0)
    medical_history: Optional[str] = None


class PetUpdate(BaseModel):
    """Update pet request"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    breed: Optional[str] = Field(None, min_length=1, max_length=100)
    age: Optional[float] = Field(None, gt=0)
    weight: Optional[float] = Field(None, gt=0)
    medical_history: Optional[str] = None


class PetResponse(BaseModel):
    """Pet response"""
    id: str
    owner_id: str
    name: str
    species: str
    breed: str
    age: float
    weight: float
    medical_history: Optional[str]
    created_at: datetime


# ==================== CLINICS ====================

class ClinicCreate(BaseModel):
    """Create clinic request"""
    clinic_name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=20)
    address: str = Field(..., min_length=1, max_length=300)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    specializations: List[str] = Field(default_factory=list)
    operating_hours: Optional[str] = None


class ClinicUpdate(BaseModel):
    """Update clinic request"""
    clinic_name: Optional[str] = Field(None, min_length=1, max_length=200)
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    address: Optional[str] = Field(None, min_length=1, max_length=300)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    specializations: Optional[List[str]] = None
    operating_hours: Optional[str] = None


class ClinicResponse(BaseModel):
    """Clinic response"""
    id: str
    owner_id: str
    clinic_name: str
    email: str
    phone: str
    address: str
    latitude: float
    longitude: float
    specializations: List[str]
    operating_hours: Optional[str]
    rating: float
    reviews_count: int
    is_approved: bool
    created_at: datetime


# ==================== APPOINTMENTS ====================

class AppointmentCreate(BaseModel):
    """Create appointment request"""
    pet_id: str
    clinic_id: str
    appointment_date: str = Field(..., description="ISO 8601 datetime string")
    reason: str = Field(..., min_length=1, max_length=500)
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    """Update appointment request (clinic only)"""
    status: AppointmentStatus
    diagnosis: Optional[str] = None
    notes: Optional[str] = None
    prescription: Optional[str] = None


class AppointmentResponse(BaseModel):
    """Appointment response"""
    id: str
    pet_id: str
    clinic_id: str
    owner_id: str
    appointment_date: datetime
    status: AppointmentStatus
    reason: str
    notes: Optional[str]
    diagnosis: Optional[str]
    prescription: Optional[str]
    created_at: datetime
    updated_at: datetime


class AppointmentDetailResponse(AppointmentResponse):
    """Appointment response with related data"""
    pet: Optional[PetResponse] = None
    clinic: Optional[ClinicResponse] = None
