# Security Configuration for Production Deployment

import secrets
import string
from typing import List

class SecurityConfig:
    """Production security configuration"""
    
    @staticmethod
    def generate_secret_key(length: int = 64) -> str:
        """Generate a cryptographically secure secret key"""
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    @staticmethod
    def generate_jwt_secret() -> str:
        """Generate JWT secret key"""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def get_security_headers() -> dict:
        """Get recommended security headers"""
        return {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data: https:; "
                "connect-src 'self' https://api.reddit-trends.com https://www.google-analytics.com; "
                "frame-ancestors 'none';"
            ),
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
        }
    
    @staticmethod
    def get_cors_settings() -> dict:
        """Get CORS settings for production"""
        return {
            "allow_origins": [
                "https://admin.reddit-trends.com",
                "https://blog.reddit-trends.com",
                "https://reddit-trends.com"
            ],
            "allow_credentials": True,
            "allow_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": [
                "Accept",
                "Accept-Language",
                "Content-Language",
                "Content-Type",
                "Authorization",
                "X-Requested-With"
            ]
        }
    
    @staticmethod
    def get_rate_limit_settings() -> dict:
        """Get rate limiting settings"""
        return {
            "default": "100/hour",
            "auth": "10/minute",
            "api": "1000/hour",
            "search": "50/minute",
            "upload": "10/minute"
        }

# Generate production secrets
if __name__ == "__main__":
    print("=== PRODUCTION SECRETS ===")
    print(f"SECRET_KEY={SecurityConfig.generate_secret_key()}")
    print(f"JWT_SECRET_KEY={SecurityConfig.generate_jwt_secret()}")
    print("\n=== SECURITY HEADERS ===")
    for key, value in SecurityConfig.get_security_headers().items():
        print(f"{key}: {value}")
    print("\n=== CORS SETTINGS ===")
    cors = SecurityConfig.get_cors_settings()
    print(f"Allowed Origins: {cors['allow_origins']}")
    print(f"Allowed Methods: {cors['allow_methods']}")
    print("\n=== RATE LIMITS ===")
    for endpoint, limit in SecurityConfig.get_rate_limit_settings().items():
        print(f"{endpoint}: {limit}")