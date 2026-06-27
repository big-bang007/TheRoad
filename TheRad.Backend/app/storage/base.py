import os
import aiofiles
from fastapi import UploadFile
from app.config.settings import settings

class LocalDiskStorage:
    def __init__(self, base_directory: str = settings.UPLOAD_DIR):
        self.base_dir = base_directory
        os.makedirs(self.base_dir, exist_ok=True)

    async def save_file(self, file: UploadFile, sub_folder: str) -> str:
        """Saves an incoming byte stream asynchronously to a dedicated subdirectory."""
        target_dir = os.path.join(self.base_dir, sub_folder)
        os.makedirs(target_dir, exist_ok=True)
        
        file_path = os.path.join(target_dir, file.filename)
        
        async with aiofiles.open(file_path, 'wb') as out_file:
            while content := await file.read(1024 * 64):  # 64kb chunks
                await out_file.write(content)
                
        return file_path

storage_provider = LocalDiskStorage()