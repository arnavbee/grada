from decimal import Decimal, ROUND_HALF_UP


_UNITS = [
    'Zero',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
]
_TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']


def _under_hundred(value: int) -> str:
    if value < 20:
        return _UNITS[value]
    tens_word = _TENS[value // 10]
    return tens_word if value % 10 == 0 else f'{tens_word} {_UNITS[value % 10]}'


def _under_thousand(value: int) -> str:
    parts: list[str] = []
    if value >= 100:
        parts.append(f'{_UNITS[value // 100]} Hundred')
        value %= 100
    if value:
        parts.append(_under_hundred(value))
    return ' '.join(parts) if parts else 'Zero'


def _integer_to_words(value: int) -> str:
    if value == 0:
        return 'Zero'

    parts: list[str] = []
    groups = (
        (10000000, 'Crore'),
        (100000, 'Lakh'),
        (1000, 'Thousand'),
    )
    remainder = value
    for divisor, label in groups:
        if remainder >= divisor:
            count, remainder = divmod(remainder, divisor)
            parts.append(f'{_under_thousand(count)} {label}')
    if remainder:
        parts.append(_under_thousand(remainder))
    return ' '.join(parts)


def convert_to_words(amount: Decimal | float | int) -> str:
    normalized = Decimal(str(amount)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    whole = int(normalized)
    paise = int((normalized - Decimal(whole)) * 100)
    words = _integer_to_words(whole)
    if paise:
        return f'{words} and {_integer_to_words(paise)} Paisa only'
    return f'{words} only'
