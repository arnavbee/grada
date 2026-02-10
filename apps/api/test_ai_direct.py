import sys
import os
import asyncio
import json

# Add apps/api to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

from app.services.ai import ai_service

def test_analyze_image():
    # Use a public image URL for testing
    image_url = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2000&auto=format&fit=crop"
    print(f"Analyzing image: {image_url}")
    
    try:
        result = ai_service.analyze_image(image_url)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_analyze_image()
