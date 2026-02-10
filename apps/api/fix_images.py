"""
Fix script to update product images with pending_real_upload URLs.

This script finds the uploaded image file and updates the ProductImage records
to use the correct static file URL.
"""
from pathlib import Path
from app.db.session import SessionLocal
from app.models.product_image import ProductImage

db = SessionLocal()

try:
    # Find all images with pending_real_upload
    pending_images = db.query(ProductImage).filter(
        ProductImage.file_url == 'pending_real_upload'
    ).all()
    
    print(f"Found {len(pending_images)} images with pending_real_upload")
    
    # Get the uploaded file
    upload_dir = Path("static/uploads")
    uploaded_files = list(upload_dir.glob("*.png")) + list(upload_dir.glob("*.jpg"))
    
    if uploaded_files:
        # Use the first uploaded file for all pending images
        first_file = uploaded_files[0]
        new_url = f"/static/uploads/{first_file.name}"
        
        print(f"Updating images to use: {new_url}")
        
        for img in pending_images:
            img.file_url = new_url
            print(f"  Updated image {img.id} for product {img.product_id}")
        
        db.commit()
        print(f"\n✅ Successfully updated {len(pending_images)} images!")
    else:
        print("❌ No uploaded files found in static/uploads/")
        
finally:
    db.close()
