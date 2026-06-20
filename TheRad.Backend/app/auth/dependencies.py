from fastapi import Depends, HTTPException, status, Query, WebSocketException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config.settings import settings
from app.schemas.user import TokenUser

# This tells FastAPI to look for the "Authorization: Bearer <token>" header
security = HTTPBearer()

# ---------------------------------------------------------
# 1. Standard HTTP Authentication (For normal users)
# ---------------------------------------------------------
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenUser:
    """
    Validates the JWT token from the Authorization header for standard HTTP requests.
    """
    token = credentials.credentials
    try:
        # Decode the token using your secret key
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        
        # Build and return the TokenUser schema
        return TokenUser(
            sub=str(payload.get("sub")),
            phone=str(payload.get("phone")),
            role=str(payload.get("role", "user")),
            name=payload.get("name")
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

# ---------------------------------------------------------
# 2. WebSocket Authentication (For Chat)
# ---------------------------------------------------------
async def get_current_user_ws(token: str = Query(...)) -> TokenUser:
    """ 
    Validates JWT sent via Query Parameter for WebSockets. 
    WebSockets cannot send Authorization headers.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return TokenUser(
            sub=str(payload.get("sub")),
            phone=str(payload.get("phone")),
            role=str(payload.get("role", "user")),
            name=payload.get("name")
        )
    except Exception as e:
        # WebSockets must be closed with specific WS codes, not HTTP Exceptions
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")

# ---------------------------------------------------------
# 3. Admin Authentication (For Admin Panel / Uploads)
# ---------------------------------------------------------
async def get_current_admin(current_user: TokenUser = Depends(get_current_user)) -> TokenUser:
    """
    Security Dependency: Verifies the logged-in user is an admin.
    If they are just a 'user' or 'student', it throws a 403 Forbidden.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action. Admin access required."
        )
    return current_user