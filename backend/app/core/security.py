from app.core.config import settings
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.database import get_session
from app.models import User
from sqlmodel import Session, select
import ssl
import certifi

# 1. Configuration
CLERK_JWKS_URL = settings.CLERK_JWKS_URL
CLERK_AUDIENCE = settings.CLERK_AUDIENCE

# 2. Cache the Public Keys (So we don't hit Clerk API on every request)
# FIX: MacOS often lacks root certs in Python. We explicitly use certifi's bundle.
ssl_context = ssl.create_default_context(cafile=certifi.where())
jwks_client = jwt.PyJWKClient(CLERK_JWKS_URL, ssl_context=ssl_context)

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
        # Auto-create the user (JIT Provisioning)
        # We can extract more info from the token if available, usually Clerk tokens have 'email' or custom claims
        # For now, we'll try to extract email if present, or fallback to a placeholder
        
        # NOTE: Clerk JWT templates might need to be configured to include email.
        # Assuming standard claims or simple fallback for now.
        email = payload.get("email", "") 
        if not email and "email_addresses" in payload:
             # Sometimes passed as list in custom claims
             emails = payload.get("email_addresses", [])
             if emails:
                 email = emails[0].get("email_address", "")

        full_name = payload.get("name", "Unknown User")
        
        # Create new user
        user = User(
            clerk_id=clerk_id,
            email=email or f"{clerk_id}@placeholder.com", # Fallback if email not in token
            full_name=full_name,
            role="CONTRACTOR" # Default role
        )
        try:
            session.add(user)
            session.commit()
            session.refresh(user)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to synchronize user profile"
            )  
    return user