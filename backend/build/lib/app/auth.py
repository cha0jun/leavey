import os
import jwt
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

CLERK_ISSUER = os.environ.get("CLERK_ISSUER", "https://your-clerk-issuer-url")
JWKS_URL = f"{CLERK_ISSUER}/.well-known/jwks.json"

async def get_jwks():
    async with httpx.AsyncClient() as client:
        response = await client.get(JWKS_URL)
        response.raise_for_status()
        return response.json()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # Get Key ID from header
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        
        # Fetch JWKS (Caching recommended in production)
        jwks = await get_jwks()
        
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == kid:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break
        
        if not rsa_key:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Key ID")

        # Decode token
        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(rsa_key)
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience="your-audience-if-needed", # Optional
            issuer=CLERK_ISSUER,
            options={"verify_aud": False} # Adjust based on needs
        )
        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Could not validate credentials: {e}")
    except Exception as e:
         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Authentication error: {e}")
