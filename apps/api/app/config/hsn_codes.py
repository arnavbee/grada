HSN_CODE_MAP = {
    '100% cotton': '62063000',
    'cotton': '62063000',
    'cotton poplin': '62063000',
    '100% polyester': '62044400',
    'polyester': '62044400',
    'polymoss': '62044400',
    'polycrepe': '62044400',
    'poly weightless': '62044400',
    'poly spandex': '62044400',
}


def get_hsn_code(fabric_composition: str) -> str:
    normalized = str(fabric_composition or '').strip().lower()
    for key, code in HSN_CODE_MAP.items():
        if key in normalized:
            return code
    return '62044400'
