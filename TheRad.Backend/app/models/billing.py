from sqlalchemy import Column, String, Integer, DateTime, Float, Boolean
from app.core.database import Base
import datetime

class PromoCode(Base):
    __tablename__ = "promo_codes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    discount_percent = Column(Float, nullable=False) 
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)