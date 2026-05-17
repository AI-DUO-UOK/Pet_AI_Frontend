"""
Router for authentication endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from auth import get_current_user, AuthUser
from schemas import AuthResponse, LoginRequest
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/verify", response_model=AuthResponse)
async def verify_token(current_user: AuthUser = Depends(get_current_user)):
    """
    Verify JWT token and get user info
    
    - Validates token is still valid
    - Returns user information
    - Used by frontend to verify session
    """
    return AuthResponse(
        access_token="",  # Token already provided, no new token needed
        user_id=current_user.user_id,
        email=current_user.email,
        role=current_user.role
    )


@router.get("/me", response_model=AuthResponse)
async def get_current_user_info(current_user: AuthUser = Depends(get_current_user)):
    """
    Get current authenticated user info
    
    - Returns authenticated user's information
    - Verifies token is valid
    """
    return AuthResponse(
        access_token="",
        user_id=current_user.user_id,
        email=current_user.email,
        role=current_user.role
    )


# Note: Signup and Login are typically handled by Supabase Auth directly
# Backend only needs to verify tokens and manage permissions
# If you need custom auth, implement here or use Supabase Auth with webhooks
