from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
import logging
import uuid
from datetime import datetime
from pathlib import Path
from supabase import create_client, Client
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Supabase configuration
supabase_url = os.environ['SUPABASE_URL']
supabase_anon_key = os.environ['SUPABASE_ANON_KEY'] 
supabase_service_key = os.environ['SUPABASE_SERVICE_KEY']

# Create Supabase clients with schema configuration
from supabase.client import ClientOptions

client_options = ClientOptions(schema="text_grow")
supabase_client: Client = create_client(supabase_url, supabase_service_key, client_options)
supabase_anon: Client = create_client(supabase_url, supabase_anon_key, client_options)

# Create the main app
app = FastAPI(title="TextGrow API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Pydantic Models
class UserProfile(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = {}
    created_at: datetime
    updated_at: datetime

class UserCreate(BaseModel):
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None

class Shortcut(BaseModel):
    id: str
    user_id: str
    trigger: str
    content: str
    created_at: datetime
    updated_at: datetime

class ShortcutCreate(BaseModel):
    trigger: str
    content: str

class ShortcutUpdate(BaseModel):
    trigger: Optional[str] = None
    content: Optional[str] = None

class Folder(BaseModel):
    id: str
    user_id: str
    name: str
    created_at: datetime
    updated_at: datetime

class FolderCreate(BaseModel):
    name: str

class FolderUpdate(BaseModel):
    name: str

class Tag(BaseModel):
    id: str
    name: str
    created_at: datetime
    updated_at: datetime

class TagCreate(BaseModel):
    name: str

class ShortcutWithDetails(BaseModel):
    id: str
    user_id: str
    trigger: str
    content: str
    created_at: datetime
    updated_at: datetime
    folders: List[Folder] = []
    tags: List[Tag] = []

class SharedFolder(BaseModel):
    id: str
    folder_id: str
    share_link: str
    created_at: datetime
    expires_at: Optional[datetime] = None

class SharedFolderCreate(BaseModel):
    folder_id: str
    expires_at: Optional[datetime] = None

# Authentication helper
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Get current user from JWT token"""
    try:
        token = credentials.credentials
        # Verify token with Supabase
        user = supabase_client.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        return user.user.id
    except Exception as e:
        # For development, we'll create a mock user if no token is provided
        # In production, this should be removed
        mock_user_id = "12345678-1234-1234-1234-123456789012"
        
        # Ensure mock user exists in database
        existing_user = supabase_client.table('users').select('*').eq('id', mock_user_id).execute()
        if not existing_user.data:
            mock_user = {
                'id': mock_user_id,
                'email': 'demo@textgrow.com',
                'name': 'Demo User',
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            try:
                supabase_client.table('users').insert(mock_user).execute()
            except Exception as insert_error:
                print(f"Failed to create mock user: {insert_error}")
                # Just continue with the existing user ID
        
        return mock_user_id

# Health check endpoints
@api_router.get("/")
async def root():
    return {"message": "TextGrow API is running", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    try:
        # Test Supabase connection
        result = supabase_client.table('users').select('id').limit(1).execute()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

# Authentication endpoints
@api_router.post("/auth/signup")
async def signup(user_data: UserCreate):
    """Create a new user account"""
    try:
        # Check if user already exists
        existing_user = supabase_client.table('users').select('*').eq('email', user_data.email).execute()
        if existing_user.data:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Create new user
        user_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        new_user = {
            'id': user_id,
            'email': user_data.email,
            'name': user_data.name,
            'avatar_url': user_data.avatar_url,
            'preferences': {},
            'created_at': now.isoformat(),
            'updated_at': now.isoformat()
        }
        
        result = supabase_client.table('users').insert(new_user).execute()
        return {"message": "User created successfully", "user_id": user_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/auth/me", response_model=UserProfile)
async def get_current_user_profile(user_id: str = Depends(get_current_user)):
    """Get current user profile"""
    try:
        result = supabase_client.table('users').select('*').eq('id', user_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = result.data
        return UserProfile(
            id=user_data['id'],
            email=user_data['email'],
            name=user_data.get('name'),
            avatar_url=user_data.get('avatar_url'),
            preferences=user_data.get('preferences', {}),
            created_at=datetime.fromisoformat(user_data['created_at']),
            updated_at=datetime.fromisoformat(user_data['updated_at'])
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Shortcut management endpoints
@api_router.get("/shortcuts", response_model=List[ShortcutWithDetails])
async def get_shortcuts(user_id: str = Depends(get_current_user)):
    """Get all shortcuts for the current user with folder and tag details"""
    try:
        # Get shortcuts
        shortcuts_result = supabase_client.table('shortcuts').select('*').eq('user_id', user_id).execute()
        
        shortcuts_with_details = []
        for shortcut in shortcuts_result.data:
            # Get folders for this shortcut
            folders_result = supabase_client.rpc('get_shortcut_folders', {'shortcut_id': shortcut['id']}).execute()
            folders = [Folder(**folder) for folder in (folders_result.data or [])]
            
            # Get tags for this shortcut
            tags_result = supabase_client.rpc('get_shortcut_tags', {'shortcut_id': shortcut['id']}).execute()
            tags = [Tag(**tag) for tag in (tags_result.data or [])]
            
            shortcuts_with_details.append(ShortcutWithDetails(
                id=shortcut['id'],
                user_id=shortcut['user_id'],
                trigger=shortcut['trigger'],
                content=shortcut['content'],
                created_at=datetime.fromisoformat(shortcut['created_at']),
                updated_at=datetime.fromisoformat(shortcut['updated_at']),
                folders=folders,
                tags=tags
            ))
        
        return shortcuts_with_details
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/shortcuts", response_model=Shortcut)
async def create_shortcut(shortcut_data: ShortcutCreate, user_id: str = Depends(get_current_user)):
    """Create a new shortcut"""
    try:
        # Check shortcut limit (500 per user)
        count_result = supabase_client.table('shortcuts').select('id', count='exact').eq('user_id', user_id).execute()
        if count_result.count and count_result.count >= 500:
            raise HTTPException(status_code=400, detail="Maximum shortcut limit (500) reached")
        
        shortcut_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        new_shortcut = {
            'id': shortcut_id,
            'user_id': user_id,
            'trigger': shortcut_data.trigger,
            'content': shortcut_data.content,
            'created_at': now.isoformat(),
            'updated_at': now.isoformat()
        }
        
        result = supabase_client.table('shortcuts').insert(new_shortcut).execute()
        
        return Shortcut(
            id=shortcut_id,
            user_id=user_id,
            trigger=shortcut_data.trigger,
            content=shortcut_data.content,
            created_at=now,
            updated_at=now
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/shortcuts/{shortcut_id}", response_model=Shortcut)
async def update_shortcut(shortcut_id: str, shortcut_data: ShortcutUpdate, user_id: str = Depends(get_current_user)):
    """Update a shortcut"""
    try:
        # Verify ownership
        existing = supabase_client.table('shortcuts').select('*').eq('id', shortcut_id).eq('user_id', user_id).single().execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Shortcut not found")
        
        update_data = {
            'updated_at': datetime.utcnow().isoformat()
        }
        
        if shortcut_data.trigger is not None:
            update_data['trigger'] = shortcut_data.trigger
        if shortcut_data.content is not None:
            update_data['content'] = shortcut_data.content
        
        result = supabase_client.table('shortcuts').update(update_data).eq('id', shortcut_id).execute()
        
        updated_shortcut = result.data[0]
        return Shortcut(
            id=updated_shortcut['id'],
            user_id=updated_shortcut['user_id'],
            trigger=updated_shortcut['trigger'],
            content=updated_shortcut['content'],
            created_at=datetime.fromisoformat(updated_shortcut['created_at']),
            updated_at=datetime.fromisoformat(updated_shortcut['updated_at'])
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/shortcuts/{shortcut_id}")
async def delete_shortcut(shortcut_id: str, user_id: str = Depends(get_current_user)):
    """Delete a shortcut"""
    try:
        # Verify ownership
        existing = supabase_client.table('shortcuts').select('*').eq('id', shortcut_id).eq('user_id', user_id).single().execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Shortcut not found")
        
        # Delete associations first
        supabase_client.table('shortcut_tag_assignments').delete().eq('shortcut_id', shortcut_id).execute()
        supabase_client.table('folder_shortcuts').delete().eq('shortcut_id', shortcut_id).execute()
        
        # Delete shortcut
        supabase_client.table('shortcuts').delete().eq('id', shortcut_id).execute()
        
        return {"message": "Shortcut deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Folder management endpoints
@api_router.get("/folders", response_model=List[Folder])
async def get_folders(user_id: str = Depends(get_current_user)):
    """Get all folders for the current user"""
    try:
        result = supabase_client.table('folders').select('*').eq('user_id', user_id).execute()
        
        folders = []
        for folder in result.data:
            folders.append(Folder(
                id=folder['id'],
                user_id=folder['user_id'],
                name=folder['name'],
                created_at=datetime.fromisoformat(folder['created_at']),
                updated_at=datetime.fromisoformat(folder['updated_at'])
            ))
        
        return folders
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/folders/{folder_id}", response_model=Folder)
async def update_folder(folder_id: str, folder_data: FolderUpdate, user_id: str = Depends(get_current_user)):
    """Update a folder"""
    try:
        # Verify ownership
        existing = supabase_client.table('folders').select('*').eq('id', folder_id).eq('user_id', user_id).single().execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Folder not found")
        
        update_data = {
            'name': folder_data.name,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        result = supabase_client.table('folders').update(update_data).eq('id', folder_id).execute()
        
        updated_folder = result.data[0]
        return Folder(
            id=updated_folder['id'],
            user_id=updated_folder['user_id'],
            name=updated_folder['name'],
            created_at=datetime.fromisoformat(updated_folder['created_at']),
            updated_at=datetime.fromisoformat(updated_folder['updated_at'])
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/folders/{folder_id}")
async def delete_folder(folder_id: str, user_id: str = Depends(get_current_user)):
    """Delete a folder"""
    try:
        # Verify ownership
        existing = supabase_client.table('folders').select('*').eq('id', folder_id).eq('user_id', user_id).single().execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Folder not found")
        
        # Delete folder shortcuts associations
        supabase_client.table('folder_shortcuts').delete().eq('folder_id', folder_id).execute()
        
        # Delete folder  
        supabase_client.table('folders').delete().eq('id', folder_id).execute()
        
        return {"message": "Folder deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/folders", response_model=Folder)
async def create_folder(folder_data: FolderCreate, user_id: str = Depends(get_current_user)):
    """Create a new folder"""
    try:
        folder_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        new_folder = {
            'id': folder_id,
            'user_id': user_id,
            'name': folder_data.name,
            'created_at': now.isoformat(),
            'updated_at': now.isoformat()
        }
        
        result = supabase_client.table('folders').insert(new_folder).execute()
        
        return Folder(
            id=folder_id,
            user_id=user_id,
            name=folder_data.name,
            created_at=now,
            updated_at=now
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Tag management endpoints
@api_router.get("/tags", response_model=List[Tag])
async def get_tags():
    """Get all available tags"""
    try:
        result = supabase_client.table('tags').select('*').execute()
        
        tags = []
        for tag in result.data:
            tags.append(Tag(
                id=tag['id'],
                name=tag['name'],
                created_at=datetime.fromisoformat(tag['created_at']),
                updated_at=datetime.fromisoformat(tag['updated_at'])
            ))
        
        return tags
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/tags/{tag_id}", response_model=Tag)
async def update_tag(tag_id: str, tag_data: TagCreate):
    """Update a tag"""
    try:
        # Check if tag exists
        existing = supabase_client.table('tags').select('*').eq('id', tag_id).single().execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Tag not found")
        
        update_data = {
            'name': tag_data.name,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        result = supabase_client.table('tags').update(update_data).eq('id', tag_id).execute()
        
        updated_tag = result.data[0]
        return Tag(
            id=updated_tag['id'],
            name=updated_tag['name'],
            created_at=datetime.fromisoformat(updated_tag['created_at']),
            updated_at=datetime.fromisoformat(updated_tag['updated_at'])
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/tags/{tag_id}")
async def delete_tag(tag_id: str):
    """Delete a tag"""
    try:
        # Check if tag exists
        existing = supabase_client.table('tags').select('*').eq('id', tag_id).single().execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Tag not found")
        
        # Delete tag assignments
        supabase_client.table('shortcut_tag_assignments').delete().eq('tag_id', tag_id).execute()
        
        # Delete tag
        supabase_client.table('tags').delete().eq('id', tag_id).execute()
        
        return {"message": "Tag deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Export/Import endpoints
@api_router.get("/export")
async def export_shortcuts(user_id: str = Depends(get_current_user)):
    """Export all user shortcuts"""
    try:
        # Get all user data
        shortcuts_result = supabase_client.table('shortcuts').select('*').eq('user_id', user_id).execute()
        folders_result = supabase_client.table('folders').select('*').eq('user_id', user_id).execute()
        
        export_data = {
            'version': '1.0',
            'exported_at': datetime.utcnow().isoformat(),
            'shortcuts': shortcuts_result.data,
            'folders': folders_result.data
        }
        
        return export_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/import")
async def import_shortcuts(import_data: Dict[str, Any], user_id: str = Depends(get_current_user)):
    """Import shortcuts from exported data"""
    try:
        imported_count = 0
        
        # Import shortcuts
        if 'shortcuts' in import_data:
            for shortcut_data in import_data['shortcuts']:
                # Create new shortcut with new ID
                new_shortcut = {
                    'id': str(uuid.uuid4()),
                    'user_id': user_id,
                    'trigger': shortcut_data['trigger'],
                    'content': shortcut_data['content'],
                    'created_at': datetime.utcnow().isoformat(),
                    'updated_at': datetime.utcnow().isoformat()
                }
                
                supabase_client.table('shortcuts').insert(new_shortcut).execute()
                imported_count += 1
        
        return {"imported_count": imported_count}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/tags", response_model=Tag)
async def create_tag(tag_data: TagCreate):
    """Create a new tag"""
    try:
        # Check if tag already exists
        existing = supabase_client.table('tags').select('*').eq('name', tag_data.name).execute()
        if existing.data:
            return Tag(**existing.data[0])
        
        tag_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        new_tag = {
            'id': tag_id,
            'name': tag_data.name,
            'created_at': now.isoformat(),
            'updated_at': now.isoformat()
        }
        
        result = supabase_client.table('tags').insert(new_tag).execute()
        
        return Tag(
            id=tag_id,
            name=tag_data.name,
            created_at=now,
            updated_at=now
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Search endpoint
@api_router.get("/search", response_model=List[ShortcutWithDetails])
async def search_shortcuts(q: str, user_id: str = Depends(get_current_user)):
    """Search shortcuts by trigger, content, or tags"""
    try:
        # Search in triggers and content
        result = supabase_client.table('shortcuts').select('*').eq('user_id', user_id).or_(f'trigger.ilike.%{q}%,content.ilike.%{q}%').execute()
        
        shortcuts_with_details = []
        for shortcut in result.data:
            # Get folders and tags for each shortcut (same as get_shortcuts)
            folders_result = supabase_client.rpc('get_shortcut_folders', {'shortcut_id': shortcut['id']}).execute()
            folders = [Folder(**folder) for folder in (folders_result.data or [])]
            
            tags_result = supabase_client.rpc('get_shortcut_tags', {'shortcut_id': shortcut['id']}).execute()
            tags = [Tag(**tag) for tag in (tags_result.data or [])]
            
            shortcuts_with_details.append(ShortcutWithDetails(
                id=shortcut['id'],
                user_id=shortcut['user_id'],
                trigger=shortcut['trigger'],
                content=shortcut['content'],
                created_at=datetime.fromisoformat(shortcut['created_at']),
                updated_at=datetime.fromisoformat(shortcut['updated_at']),
                folders=folders,
                tags=tags
            ))
        
        return shortcuts_with_details
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)