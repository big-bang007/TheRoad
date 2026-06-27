from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes import feed
from app.config.settings import settings
from app.database.base import Base
from app.database.connection import engine
from fastapi.staticfiles import StaticFiles
import os
from app.routes import health, videos, progress, chat, auth, user, admin_lesson, admin
from app.routes.lesson import router as lesson_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles startup system routines including automated table creation."""
    async with engine.begin() as conn:
        # DB Table setup for MVP version
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0.mvp",
    lifespan=lifespan
)
os.makedirs("uploads/feed", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.on_event("startup")
async def inspect_active_routes():
    print("\n🕵️ BACKEND ROUTE MAP REPORT:")
    for route in app.routes:
        if hasattr(route, "methods"):
            print(f"   -> URL: {route.path} | Methods: {route.methods} | Controller: {route.name}")
    print("🕵️ END OF ROUTE REPORT\n")

# ✅ FIX 1 & 2: Added missing commas and explicit whitelist
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173", 
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "https://hyggee.ir",
    "https://www.hyggee.ir",
    "https://app.hyggee.ir",
    "https://upload.hyggee.ir"
]

# ✅ FIX 3 & 4: Bound the origins list and enabled credentials for JWT tokens
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       
    allow_credentials=True,   
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route Wiring - Clean and organized
app.include_router(health.router)
app.include_router(auth.router, prefix="/api/v1")
app.include_router(user.router)
app.include_router(videos.router, prefix="/api/v1", tags=["Videos"])
app.include_router(progress.router, prefix="/api/v1", tags=["Progress"])
app.include_router(lesson_router, prefix="/api/v1")
app.include_router(admin_lesson.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1/ws/chat", tags=["Chat"])
app.include_router(feed.router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)