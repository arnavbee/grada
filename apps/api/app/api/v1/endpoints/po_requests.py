from typing import Any
import io
import csv

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models import PORequest, PORequestItem, Product, User
from app.schemas.po_request import (
    PORequestBatchUpdateItems,
    PORequestCreate,
    PORequestListResponse,
    PORequestResponse,
    PORequestUpdate,
)

router = APIRouter()

@router.post('/', response_model=PORequestResponse, status_code=status.HTTP_201_CREATED)
def create_po_request(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request_in: PORequestCreate,
) -> Any:
    # Validate products exist and belong to company
    products = db.scalars(
        select(Product).where(Product.company_id == current_user.company_id, Product.id.in_(request_in.product_ids))
    ).all()
    
    if len(products) != len(request_in.product_ids):
        raise HTTPException(status_code=400, detail="One or more products not found or access denied")
        
    po_request = PORequest(
        company_id=current_user.company_id,
        created_by_user_id=current_user.id,
        status="draft"
    )
    db.add(po_request)
    db.flush()
    
    for product_id in request_in.product_ids:
        item = PORequestItem(
            po_request_id=po_request.id,
            product_id=product_id,
        )
        db.add(item)
        
    db.commit()
    db.refresh(po_request)
    return po_request

@router.get('/{po_request_id}', response_model=PORequestResponse)
def get_po_request(
    po_request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    po_request = db.scalar(
        select(PORequest).where(
            PORequest.id == po_request_id, PORequest.company_id == current_user.company_id
        )
    )
    if not po_request:
        raise HTTPException(status_code=404, detail="PO Request not found")
    return po_request

@router.put('/{po_request_id}/items', response_model=PORequestResponse)
def update_po_request_items(
    po_request_id: str,
    items_update: PORequestBatchUpdateItems,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    po_request = db.scalar(
        select(PORequest).where(
            PORequest.id == po_request_id, PORequest.company_id == current_user.company_id
        )
    )
    if not po_request:
        raise HTTPException(status_code=404, detail="PO Request not found")
        
    # Create dict for faster lookup
    update_dict = {i.id: i for i in items_update.items}
    
    for item in po_request.items:
        if item.id in update_dict:
            upd = update_dict[item.id]
            if upd.po_price is not None:
                item.po_price = upd.po_price
            if upd.osp_inside_price is not None:
                item.osp_inside_price = upd.osp_inside_price
            if upd.fabric_composition is not None:
                item.fabric_composition = upd.fabric_composition
            if upd.size_ratio is not None:
                item.size_ratio = upd.size_ratio
            if upd.extracted_attributes is not None:
                item.extracted_attributes = upd.extracted_attributes
                
    db.commit()
    db.refresh(po_request)
    return po_request

@router.post('/{po_request_id}/extract-attributes')
def extract_ai_attributes(
    po_request_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    po_request = db.scalar(
        select(PORequest).where(
            PORequest.id == po_request_id, PORequest.company_id == current_user.company_id
        )
    )
    if not po_request:
        raise HTTPException(status_code=404, detail="PO Request not found")
        
    po_request.status = 'analyzing'
    db.commit()
    
    from app.services.ai import process_po_ai_extraction_job
    background_tasks.add_task(process_po_ai_extraction_job, po_request.id)
    
    return {"status": "accepted", "message": "AI extraction started"}

@router.get('/{po_request_id}/export')
def export_po_request(
    po_request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    po_request = db.scalar(
        select(PORequest).where(
            PORequest.id == po_request_id, PORequest.company_id == current_user.company_id
        )
    )
    if not po_request:
        raise HTTPException(status_code=404, detail="PO Request not found")
        
    output = io.StringIO()
    writer = csv.writer(output)
    
    headers = [
        "Style Code", "Brand Name", "Category Type", "SKU Id", "Color", "Size", "L1", "Fibre Composition", 
        "COO", "PO PRCE", "OSP in SAR", "PO Qnty", "Knitted / Wovan", "Product Name / Title", 
        "Tops_Fit", "Top_Tyle", "Top_Neck", "Top_Lenth", "Top_pattern & Prints", "sleeve_length", 
        "*pattern", "*product_type_trousers", "Dress Print", "Dress Length", "Dress Shape", 
        "*sleeve_length_women_topwear_dr(dress)", "*neck_women(dress)", "*sleeve_styling(dress)", 
        "*pattern", "*print_or_pattern_type", "*bottom_type_sets", "*top_type_set", "Print", "Length", 
        "ethnic_sleeve_length", "*ethnic_pattern", "*ethnic_fit", "*ethnic_type", "*ethnic_neckline", 
        "*ethnic_leg_style", "ethnic_sleeve_type", "Jeans_Fit", "Jeans_Waist Rise", "Jeans_stretch", 
        "Jeans_Wash Shade", "pattern", "product_type_Outerwear", "length_topwear_nightwear_outer"
    ]
    writer.writerow(headers)
    
    from app.models.company import Company
    company_obj = db.query(Company).filter(Company.id == current_user.company_id).first()
    company_name = company_obj.name if company_obj else "Generic"
    
    for idx, item in enumerate(po_request.items):
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            continue
            
        sizes = item.size_ratio if isinstance(item.size_ratio, dict) and item.size_ratio else {"FS": 1}
        attrs = item.extracted_attributes if isinstance(item.extracted_attributes, dict) else {}
        
        variant_letter = chr(65 + (idx % 26))
        base_sku = product.sku or ""
        color_val = (product.color or "").upper().replace(" ", "")
        
        for size_label, qnty in sizes.items():
            base_qnty = int(qnty)
            if base_qnty <= 0: continue
            
            style_code = f"{base_sku}-{variant_letter}-{color_val}-{size_label}" if base_sku else ""
            brand_val = product.brand or company_name
            category_val = product.category or "Dresses"
            
            # The template seems to output one row per size with the total size quantity
            row = [
                style_code, brand_val, category_val, "", product.color or "", size_label,
                "Women", item.fabric_composition or "", "India", item.po_price or "", item.osp_inside_price or "",
                base_qnty, attrs.get("woven_knits", "Woven"), product.title or "",
                attrs.get("tops_fit", ""), attrs.get("top_style", ""), attrs.get("top_neck", ""), attrs.get("top_length", ""),
                attrs.get("top_print", ""), attrs.get("sleeve_length", ""), "", "",
                attrs.get("dress_print", ""), attrs.get("dress_length", ""), attrs.get("dress_shape", ""),
                attrs.get("sleeve_length_women_dress", ""), attrs.get("neck_women_dress", ""), attrs.get("sleeve_styling_dress", ""),
                "", "", "", "", attrs.get("ethnic_print", ""), attrs.get("ethnic_length", ""), attrs.get("ethnic_sleeve", ""),
                attrs.get("ethnic_pattern", ""), attrs.get("ethnic_fit", ""), attrs.get("ethnic_type", ""), attrs.get("ethnic_neckline", ""),
                attrs.get("ethnic_leg_style", ""), attrs.get("ethnic_sleeve_type", ""),
                attrs.get("jeans_fit", ""), attrs.get("jeans_waist_rise", ""), attrs.get("jeans_stretch", ""), attrs.get("jeans_wash_shade", ""),
                "", attrs.get("outerwear_type", ""), attrs.get("outerwear_length", "")
            ]
            writer.writerow(row)
                
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=po_request_{po_request.id}.csv"}
    )
