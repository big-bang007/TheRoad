import logging
from kavenegar import KavenegarAPI, APIException, HTTPException

logger = logging.getLogger(__name__)

def send_otp_sms(phone_number: str, otp_code: str) -> bool:
    # 1. HARDCODE THE API KEY AND DO NOT OVERWRITE IT
    api_key = "6A53756B436C33504C7656336E31542B4E33662B37524C4D6B54655075476245636A38387570642F5846673D"
    template_name = "verify"

    print(f"\nDEBUG: Forced API Key: {api_key[:5]}...")
    print(f"DEBUG: Using Template: {template_name}")

    try:
        api = KavenegarAPI(api_key)
        params = {
            'receptor': phone_number,
            'token': str(otp_code),
            'template': template_name
        }
        
        # 2. FIRE THE API REQUEST
        response = api.verify_lookup(params)
        
        # 3. PRINT THE SUCCESS
        print(f"✅ Kavenegar API Success: {response}") 
        return True

    except Exception as e:
        print(f"❌ Kavenegar API CRASHED with error: {str(e)}")
        return False