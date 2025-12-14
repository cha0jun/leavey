import os
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt.algorithms import RSAAlgorithm
import requests
from app.core.database import get_session
from app.models import User
from sqlmodel import Session, select

# 1. Configuration
# Get this from Clerk Dashboard -> API Keys -> JWKS URL
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL", "https://api.clerk.com/v1/jwks")
CLERK_AUDIENCE = os.getenv("CLERK_AUDIENCE", "") # Optional: If you use audiences

# 2. Cache the Public Keys (So we don't hit Clerk API on every request)
jwks_client = jwt.PyJWKClient(CLERK_JWKS_URL)

security_scheme = HTTPBearer()

def verify_clerk_token(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)) -> dict:
    token = credentials.credentials
    
    try:
        # Get the signing key from the token header (kid)
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        # Decode and verify
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=CLERK_AUDIENCE if CLERK_AUDIENCE else None,
            options={"verify_exp": True} # Checks expiration automatically
        )
        
        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Token has expired"
        )
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail=f"Invalid token: {str(e)}"
        )

# 3. The "Vibe" Dependency: Use this in your Routers
def get_current_user(
    payload: dict = Depends(verify_clerk_token), 
    session: Session = Depends(get_session)
) -> User:
    """
    Resolves the Clerk Token to a local Database User.
    If the user doesn't exist locally (Shadow User issue), we throw an error.
    """
    clerk_id = payload.get("sub") # 'sub' is the standard Claim for User ID
    
    # Query our local DB using the Clerk ID
    statement = select(User).where(User.clerk_id == clerk_id)
    user = session.exec(statement).first()
    
    if not user:
        # Edge Case: Webhook hasn't fired yet, or sync failed.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="User not synchronized with internal database."
        )
        
    return user