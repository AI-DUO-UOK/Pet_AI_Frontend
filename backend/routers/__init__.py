"""Routers package"""
from .appointments import router as appointments_router
from .pets import router as pets_router
from .clinics import router as clinics_router
from .auth import router as auth_router

__all__ = [
    "appointments_router",
    "pets_router",
    "clinics_router",
    "auth_router"
]
