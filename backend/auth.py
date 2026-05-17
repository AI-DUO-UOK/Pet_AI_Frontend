"""
Authentication utilities for JWT verification and user extraction
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from config import get_settings
from typing import Optional, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer()


class AuthUser:
    """Represents authenticated user from JWT"""
    def __init__(self, user_id: str, email: str, role: str = "owner"):
        self.user_id = user_id
        self.email = email
        self.role = role  # owner, clinic, admin


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> AuthUser:
    """
    Extract and validate JWT token, return authenticated user
    
    Args:
        credentials: HTTP Bearer token from Authorization header
        
    Returns:
        AuthUser with user_id, email, and role
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    token = credentials.credentials
    settings = get_settings()
    
    try:
        # Decode JWT token
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.ALGORITHM]
        )
        
        # Extract user_id from 'sub' claim (Supabase standard)
        user_id: str = payload.get("sub")
        if user_id is None:
            logger.warning("JWT token missing 'sub' claim")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check token expiration (optional - jwt.decode does this by default)
        exp: Optional[int] = payload.get("exp")
        if exp and datetime.utcfromtimestamp(exp) < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Extract email
        email: str = payload.get("email", "")
        
        # Extract custom role claim (if set by Supabase)
        role: str = payload.get("user_metadata", {}).get("role", "owner")
        
        return AuthUser(user_id=user_id, email=email, role=role)
        
    except JWTError as e:
        logger.error(f"JWT validation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_with_role(
    required_role: Optional[str] = None
) -> callable:
    """
    Factory function to create dependency with role checking
    
    Args:
        required_role: Role to check for (optional)
        
    Returns:
        Dependency function
    """
    async def role_checker(user: AuthUser = Depends(get_current_user)) -> AuthUser:
        if required_role and user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires {required_role} role",
            )
        return user
    
    return role_checker
