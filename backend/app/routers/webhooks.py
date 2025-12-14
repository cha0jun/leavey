from fastapi import APIRouter, Request
# import svix # In production, verify signatures!

router = APIRouter()

@router.post("/clerk")
async def clerk_webhook(request: Request):
    """
    Receives events from Clerk (User Created, User Updated).
    For now, we just acknowledge them.
    IN PROD: Use svix to verify 'svix-id', 'svix-timestamp', 'svix-signature' headers.
    """
    payload = await request.json()
    event_type = payload.get("type")
    
    print(f"Received Clerk Webhook: {event_type}")
    
    # Logic to sync user to DB would go here.
    # We already do JIT provisioning in the API, so this is a backup/cleaner way.
    
    return {"status": "ignored_for_now"}
