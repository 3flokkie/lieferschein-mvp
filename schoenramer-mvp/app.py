from __future__ import annotations

import base64
import json
import logging
import re
from dataclasses import asdict, dataclass, field
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Any, Iterable, Literal, Optional, Union

import streamlit as st
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

try:
    import requests
except ImportError:  # pragma: no cover
    requests = None

try:
    import pytesseract
except ImportError:  # pragma: no cover
    pytesseract = None

try:
    from dateutil import parser as date_parser
except ImportError:  # pragma: no cover
    date_parser = None


OCRBackend = Literal['auto', 'transformers', 'ollama', 'tesseract']


def get_backend_status() -> dict[str, bool]:
    status = {'tesseract': pytesseract is not None, 'ollama': requests is not None, 'transformers': False}
    try:
        import torch  # noqa: F401
        from transformers import AutoModelForCausalLM, AutoProcessor  # noqa: F401
    except Exception:
        status['transformers'] = False
    else:
        status['transformers'] = True
    return status


@dataclass
class OCRResult:
    text: str
    backend: str
    confidence: float
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            'text': self.text,
            'backend': self.backend,
            'confidence': self.confidence,
            'metadata': self.metadata,
        }


class OCREngine:
    """Extract raw text from a Lieferschein using local vision/OCR backends."""

    def __init__(
        self,
        backend: OCRBackend = 'auto',
        model_id: str = 'microsoft/Florence-2-base-ft',
        ollama_model: str = 'qwen2.5vl:3b',
        language: str = 'deu',
        timeout_seconds: int = 120,
    ) -> None:
        self.backend = backend
        self.model_id = model_id
        self.ollama_model = ollama_model
        self.language = language
        self.timeout_seconds = timeout_seconds
        self.logger = logging.getLogger(__name__)

    def extract(self, image: Union[Image.Image, Path, str]) -> OCRResult:
        pil_image = self._load_image(image)
        attempts: list[dict[str, str]] = []

        for backend_name in self._backend_order():
            try:
                text = self._run_backend(backend_name, pil_image)
                if text.strip():
                    return OCRResult(
                        text=text.strip(),
                        backend=backend_name,
                        confidence=self._estimate_ocr_confidence(text, backend_name),
                        metadata={
                            'attempts': attempts,
                            'model_id': self.model_id if backend_name == 'transformers' else None,
                            'ollama_model': self.ollama_model if backend_name == 'ollama' else None,
                            'language': self.language,
                        },
                    )
            except Exception as exc:  # pragma: no cover - backend dependent
                attempts.append({'backend': backend_name, 'error': str(exc)})
                self.logger.warning('OCR backend %s failed: %s', backend_name, exc)

        attempts_text = '; '.join(f'{item["backend"]}: {item["error"]}' for item in attempts) if attempts else 'no attempts'
        raise RuntimeError(f'No OCR backend could extract text from the provided image. Attempts: {attempts_text}')

    def _backend_order(self) -> list[str]:
        if self.backend != 'auto':
            return [self.backend]

        status = get_backend_status()
        preferred: list[str] = []
        if status['tesseract']:
            preferred.append('tesseract')
        if status['ollama']:
            preferred.append('ollama')
        if status['transformers']:
            preferred.append('transformers')
        return preferred or ['tesseract', 'ollama', 'transformers']

    def _run_backend(self, backend_name: str, image: Image.Image) -> str:
        if backend_name == 'transformers':
            return self._extract_with_transformers(image)
        if backend_name == 'ollama':
            return self._extract_with_ollama(image)
        if backend_name == 'tesseract':
            return self._extract_with_tesseract(image)
        raise ValueError(f'Unknown OCR backend: {backend_name}')

    def _load_image(self, image: Union[Image.Image, Path, str]) -> Image.Image:
        if isinstance(image, Image.Image):
            pil_image = image.copy()
        else:
            pil_image = Image.open(image)

        if pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')
        return self._preprocess_image(pil_image)

    def _preprocess_image(self, image: Image.Image) -> Image.Image:
        grayscale = ImageOps.grayscale(image)
        grayscale = ImageOps.autocontrast(grayscale)
        grayscale = ImageEnhance.Sharpness(grayscale).enhance(1.6)
        return grayscale.filter(ImageFilter.SHARPEN).convert('RGB')

    def _extract_with_transformers(self, image: Image.Image) -> str:
        try:
            import torch
            from transformers import AutoModelForCausalLM, AutoProcessor
        except ImportError as exc:  # pragma: no cover - optional dependency
            raise RuntimeError('transformers backend is not installed') from exc

        processor = AutoProcessor.from_pretrained(self.model_id, trust_remote_code=True)
        model = AutoModelForCausalLM.from_pretrained(
            self.model_id,
            trust_remote_code=True,
            torch_dtype=torch.float32,
        )

        if torch.backends.mps.is_available():
            model = model.to('mps')

        prompt = '<OCR>'
        inputs = processor(text=prompt, images=image, return_tensors='pt')
        if torch.backends.mps.is_available():
            inputs = {key: value.to('mps') if hasattr(value, 'to') else value for key, value in inputs.items()}

        generated_ids = model.generate(**inputs, max_new_tokens=256)
        decoded = processor.batch_decode(generated_ids, skip_special_tokens=True)
        return decoded[0] if decoded else ''

    def _extract_with_ollama(self, image: Image.Image) -> str:
        if requests is None:  # pragma: no cover - optional dependency
            raise RuntimeError('requests is not installed')

        buffer = BytesIO()
        image.save(buffer, format='PNG')
        image_b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        payload = {
            'model': self.ollama_model,
            'prompt': (
                'Extrahiere den gesamten Text aus diesem deutschen Lieferschein. '
                'Liefere nur den sichtbaren Inhalt, keine Erklärungen.'
            ),
            'images': [image_b64],
            'stream': False,
        }
        response = requests.post(
            'http://localhost:11434/api/generate',
            json=payload,
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()
        data = response.json()
        return data.get('response', '')

    def _extract_with_tesseract(self, image: Image.Image) -> str:
        if pytesseract is None:  # pragma: no cover - optional dependency
            raise RuntimeError('pytesseract is not installed')
        config = f'--psm 6 --oem 3 -l {self.language}'
        return pytesseract.image_to_string(image, config=config)

    def _estimate_ocr_confidence(self, text: str, backend_name: str) -> float:
        base_score = {
            'transformers': 0.91,
            'ollama': 0.88,
            'tesseract': 0.72,
        }.get(backend_name, 0.7)
        line_bonus = min(0.06, 0.008 * len(text.splitlines()))
        digit_bonus = min(0.05, sum(character.isdigit() for character in text) / 250.0)
        length_bonus = min(0.04, len(text) / 4000.0)
        return round(min(0.99, base_score + line_bonus + digit_bonus + length_bonus), 3)


@dataclass
class FieldResult:
    value: Optional[Any]
    confidence: float
    needs_review: bool
    source: str = 'heuristic'
    evidence: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class LineItem:
    article_number: FieldResult
    description: FieldResult
    quantity: FieldResult
    unit: FieldResult

    def to_dict(self) -> dict[str, Any]:
        return {
            'artikelnummer': self.article_number.to_dict(),
            'bezeichnung': self.description.to_dict(),
            'menge': self.quantity.to_dict(),
            'einheit': self.unit.to_dict(),
        }


@dataclass
class LieferscheinDocument:
    supplier: FieldResult
    document_number: FieldResult
    delivery_date: FieldResult
    order_number: FieldResult
    confidence: float
    needs_review: bool
    items: list[LineItem] = field(default_factory=list)
    raw_text: str = ''
    warnings: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            'lieferant': self.supplier.to_dict(),
            'belegnummer': self.document_number.to_dict(),
            'lieferdatum': self.delivery_date.to_dict(),
            'auftragsnummer': self.order_number.to_dict(),
            'gesamtsicherheit': self.confidence,
            'pruefung_erforderlich': self.needs_review,
            'positionen': [item.to_dict() for item in self.items],
            'rohtext': self.raw_text,
            'warnungen': self.warnings,
        }


_UNIT_PATTERN = r'(?:kg|g|mg|l|ml|stk|st|pcs|piece|pack|pal|ct|karton|box|fl|btl|flaschen?)'


def parse_lieferschein(raw_text: str, ocr_confidence: float = 0.0) -> dict[str, Any]:
    """Convert Lieferschein OCR text into structured JSON with confidence scores."""
    normalized = _normalize_text(raw_text)
    lines = [line.strip() for line in normalized.splitlines() if line.strip()]

    supplier = _extract_supplier(lines)
    document_number = _extract_document_number(lines)
    delivery_date = _extract_delivery_date(lines)
    order_number = _extract_order_number(lines)
    items = _extract_items(lines)

    field_confidences = [field.confidence for field in [supplier, document_number, delivery_date, order_number]]
    field_confidences.extend(item.article_number.confidence for item in items)
    field_confidences.extend(item.quantity.confidence for item in items)

    if field_confidences:
        average_field_confidence = sum(field_confidences) / len(field_confidences)
    else:
        average_field_confidence = 0.0

    overall_confidence = round(min(0.99, 0.35 * ocr_confidence + 0.65 * average_field_confidence), 3)
    document = LieferscheinDocument(
        supplier=supplier,
        document_number=document_number,
        delivery_date=delivery_date,
        order_number=order_number,
        confidence=overall_confidence,
        needs_review=overall_confidence < 0.8 or any(item.quantity.needs_review for item in items),
        items=items,
        raw_text=raw_text.strip(),
        warnings=_build_warnings(lines, overall_confidence, items),
    )
    return document.to_dict()


def _normalize_text(raw_text: str) -> str:
    text = raw_text.replace('\u00a0', ' ')
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    return re.sub(r'[ \t]+', ' ', text)


def _field(value: Optional[Any], confidence: float, source: str, evidence: Optional[str] = None) -> FieldResult:
    confidence = round(max(0.0, min(0.99, confidence)), 3)
    return FieldResult(value=value, confidence=confidence, needs_review=confidence < 0.75, source=source, evidence=evidence)


def _first_match(patterns: Iterable[str], lines: list[str]) -> tuple[Optional[str], Optional[str]]:
    for line in lines:
        for pattern in patterns:
            match = re.search(pattern, line, flags=re.IGNORECASE)
            if match:
                return match.group(1).strip(), line
    return None, None


def _extract_supplier(lines: list[str]) -> FieldResult:
    patterns = [
        r'lieferant[:\s]+(.+)$',
        r'absender[:\s]+(.+)$',
        r'versender[:\s]+(.+)$',
        r'from[:\s]+(.+)$',
    ]
    value, evidence = _first_match(patterns, lines)
    if value:
        return _field(value, 0.89 if evidence and ':' in evidence else 0.8, 'label_match', evidence)
    if lines:
        candidate = lines[0][:80]
        return _field(candidate, 0.52, 'top_line_heuristic', lines[0])
    return _field(None, 0.0, 'missing')


def _extract_document_number(lines: list[str]) -> FieldResult:
    patterns = [
        r'(?:lieferschein|belegnr\.?|belegnummer|nr\.?|document(?:\s+number)?)[^A-Z0-9]{0,12}([A-Z0-9/-]{4,})',
        r'\b([A-Z]{0,4}\d{4,}[A-Z0-9/-]*)\b',
    ]
    value, evidence = _first_match(patterns, lines)
    if value:
        confidence = 0.92 if evidence and re.search(r'lieferschein|beleg', evidence, re.IGNORECASE) else 0.7
        return _field(value, confidence, 'regex', evidence)
    return _field(None, 0.0, 'missing')


def _extract_delivery_date(lines: list[str]) -> FieldResult:
    date_patterns = [
        r'(?:datum|lieferdatum|date)[:\s]+(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})',
        r'\b(\d{4}-\d{2}-\d{2})\b',
        r'\b(\d{1,2}[./-]\d{1,2}[./-]\d{4})\b',
    ]
    value, evidence = _first_match(date_patterns, lines)
    if not value:
        return _field(None, 0.0, 'missing')

    normalized = _normalize_date(value)
    confidence = 0.9 if evidence and re.search(r'datum|lieferdatum|date', evidence, re.IGNORECASE) else 0.72
    return _field(normalized, confidence, 'date_parser' if normalized else 'regex', evidence)


def _extract_order_number(lines: list[str]) -> FieldResult:
    patterns = [
        r'(?:auftragsnr\.?|bestellnr\.?|order(?:\s+number)?|po(?:\s+no\.)?)[^A-Z0-9]{0,12}([A-Z0-9/-]{3,})',
        r'\b(PO[-/ ]?\d{3,})\b',
    ]
    value, evidence = _first_match(patterns, lines)
    if value:
        confidence = 0.87 if evidence and re.search(r'auftrags|bestell|order|po', evidence, re.IGNORECASE) else 0.68
        return _field(value, confidence, 'regex', evidence)
    return _field(None, 0.0, 'missing')


def _extract_items(lines: list[str]) -> list[LineItem]:
    items: list[LineItem] = []
    for line in lines:
        if _looks_like_header(line):
            continue

        quantity_match = re.search(rf'(?P<qty>\d+(?:[.,]\d+)?)\s*(?P<unit>{_UNIT_PATTERN})\b', line, flags=re.IGNORECASE)
        article_match = re.search(r'\b([A-Z0-9/-]{4,})\b', line)

        if not quantity_match and not article_match:
            continue

        description = _extract_description_from_line(line, article_match.group(1) if article_match else None)
        article_number = article_match.group(1) if article_match else None
        quantity = _parse_float(quantity_match.group('qty')) if quantity_match else None
        unit = quantity_match.group('unit').lower() if quantity_match else None

        article_confidence = 0.78 if article_number else 0.0
        quantity_confidence = 0.83 if quantity is not None else 0.0
        description_confidence = 0.55 if description else 0.0
        unit_confidence = 0.8 if unit else 0.0

        items.append(
            LineItem(
                article_number=_field(article_number, article_confidence, 'line_regex', line if article_number else None),
                description=_field(description, description_confidence, 'line_regex', line if description else None),
                quantity=_field(quantity, quantity_confidence, 'line_regex', line if quantity is not None else None),
                unit=_field(unit, unit_confidence, 'line_regex', line if unit else None),
            )
        )

    return items


def _looks_like_header(line: str) -> bool:
    header_keywords = ['lieferschein', 'lieferant', 'datum', 'beleg', 'auftrag', 'menge', 'artikel', 'position', 'gesamt', 'seite', 'po-']
    lower = line.lower()
    return any(keyword in lower for keyword in header_keywords)


def _extract_description_from_line(line: str, article_number: Optional[str]) -> Optional[str]:
    cleaned = line
    if article_number:
        cleaned = cleaned.replace(article_number, ' ')
    cleaned = re.sub(rf'\b\d+(?:[.,]\d+)?\s*(?:{_UNIT_PATTERN})\b', ' ', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s{2,}', ' ', cleaned).strip(' -:;')
    return cleaned[:120] if cleaned else None


def _parse_float(value: str) -> Optional[float]:
    try:
        return float(value.replace(',', '.'))
    except ValueError:
        return None


def _normalize_date(value: str) -> Optional[str]:
    if date_parser is not None:
        try:
            parsed = date_parser.parse(value, dayfirst=True)
            return parsed.date().isoformat()
        except Exception:
            pass

    for fmt in ('%d.%m.%Y', '%d/%m/%Y', '%d-%m-%Y', '%Y-%m-%d', '%d.%m.%y', '%d/%m/%y', '%d-%m-%y'):
        try:
            parsed = datetime.strptime(value, fmt)
            return parsed.date().isoformat()
        except ValueError:
            continue
    return value


def _build_warnings(lines: list[str], overall_confidence: float, items: list[LineItem]) -> list[str]:
    warnings: list[str] = []
    if overall_confidence < 0.8:
        warnings.append('Geringe Gesamtsicherheit; manuelle Prüfung empfohlen.')
    if not items:
        warnings.append('Keine Positionen erkannt.')
    if any(item.quantity.needs_review for item in items):
        warnings.append('Mindestens eine Positionsmenge erfordert Prüfung.')
    if any('mangel' in line.lower() or 'beschäd' in line.lower() or 'damage' in line.lower() for line in lines):
        warnings.append('Dokument enthält Hinweise auf Beschädigungen; bitte genau prüfen.')
    return warnings


@st.cache_resource
def build_engine(backend: str, model_id: str, ollama_model: str, language: str) -> OCREngine:
    return OCREngine(
        backend=backend,
        model_id=model_id,
        ollama_model=ollama_model,
        language=language,
    )


def load_uploaded_image(uploaded_file) -> Image.Image:
    suffix = Path(uploaded_file.name).suffix.lower()
    if suffix == '.pdf':
        try:
            import fitz  # PyMuPDF
        except ImportError as exc:
            raise RuntimeError('PDF support requires pymupdf.') from exc

        pdf_bytes = uploaded_file.read()
        document = fitz.open(stream=pdf_bytes, filetype='pdf')
        page = document.load_page(0)
        pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        return Image.frombytes('RGB', [pixmap.width, pixmap.height], pixmap.samples)

    return Image.open(uploaded_file).convert('RGB')


def render_field_card(label: str, field_data: dict[str, object]) -> None:
    confidence = float(field_data.get('confidence') or 0.0)
    needs_review = bool(field_data.get('needs_review'))
    value = field_data.get('value')

    col1, col2 = st.columns([3, 1])
    with col1:
        st.markdown(f'**{label}**')
        st.write(value if value not in (None, '') else 'Nicht gefunden')
    with col2:
        st.metric('Confidence', f'{confidence:.2f}')
        if needs_review:
            st.warning('Prüfen')


def build_demo_image() -> Image.Image:
    image = Image.new('RGB', (1200, 1600), color=(250, 250, 250))
    draw = ImageDraw.Draw(image)
    draw.rectangle((50, 50, 1150, 1550), outline=(220, 220, 220), fill=(255, 255, 255))
    draw.text((80, 90), 'Lieferschein MVP', fill=(20, 20, 20))
    draw.text((80, 140), 'Lieferant: Müller GmbH', fill=(20, 20, 20))
    draw.text((80, 190), 'Belegnummer: LF-1042', fill=(20, 20, 20))
    draw.text((80, 240), 'Lieferdatum: 04.08.2026', fill=(20, 20, 20))
    draw.text((80, 290), 'Auftragsnummer: PO-8821', fill=(20, 20, 20))
    draw.line((80, 360, 1120, 360), fill=(220, 220, 220), width=2)
    draw.text((80, 410), 'Artikel 1234  2 stk', fill=(20, 20, 20))
    draw.text((80, 460), 'Artikel 5678  5 kg', fill=(20, 20, 20))
    return image


def build_demo_result() -> tuple[Image.Image, OCRResult, dict[str, Any]]:
    raw_text = (
        'Lieferschein\n'
        'Lieferant: Müller GmbH\n'
        'Belegnummer: LF-1042\n'
        'Lieferdatum: 04.08.2026\n'
        'Auftragsnummer: PO-8821\n'
        'Artikel 1234 2 stk\n'
        'Artikel 5678 5 kg'
    )
    ocr_result = OCRResult(text=raw_text, backend='demo', confidence=0.83, metadata={'mode': 'demo'})
    parsed = parse_lieferschein(raw_text, ocr_confidence=ocr_result.confidence)
    return build_demo_image(), ocr_result, parsed


def render_analysis_result(image: Image.Image, ocr_result: OCRResult, parsed: dict[str, Any]) -> None:
    st.success(f'OCR fertig via {ocr_result.backend} mit Confidence {ocr_result.confidence:.2f}')

    left, right = st.columns(2)
    with left:
        st.subheader('Original')
        st.image(image, use_container_width=True)
    with right:
        st.subheader('Ergebnis')
        st.metric('Gesamt-Confidence', f'{parsed.get("gesamtsicherheit", 0.0):.2f}')
        if parsed.get('needs_review'):
            st.warning('Manuelle Prüfung empfohlen')
        st.json(parsed)

        json_payload = json.dumps(parsed, ensure_ascii=False, indent=2)
        st.download_button(
            'JSON herunterladen',
            data=json_payload,
            file_name='lieferschein_extraktion.json',
            mime='application/json',
        )

    st.subheader('Felder zur Prüfung')
    render_field_card('Lieferant', parsed['lieferant'])
    render_field_card('Belegnummer', parsed['belegnummer'])
    render_field_card('Lieferdatum', parsed['lieferdatum'])
    render_field_card('Auftragsnummer', parsed['auftragsnummer'])

    if parsed['positionen']:
        st.subheader('Positionen')
        st.dataframe(parsed['positionen'], use_container_width=True)
    else:
        st.info('Keine Positionen erkannt.')

    with st.expander('Raw OCR Text'):
        st.text_area('OCR', ocr_result.text, height=320)

    if parsed.get('warnings'):
        st.subheader('Warnungen')
        for warning in parsed['warnings']:
            st.warning(warning)


st.set_page_config(page_title='Schönramer Lieferschein MVP', page_icon='📦', layout='wide')
st.title('Schönramer Lieferschein MVP')
st.caption('Lokale Extraktion, Confidence Scores und JSON-Export für Lieferscheine.')

with st.sidebar:
    st.header('Lokale Modelle')
    backend = st.selectbox('OCR Backend', ['auto', 'transformers', 'ollama', 'tesseract'], index=0)
    model_id = st.text_input('Transformers Model ID', value='microsoft/Florence-2-base-ft')
    ollama_model = st.text_input('Ollama Model', value='qwen2.5vl:3b')
    language = st.text_input('Tesseract Language', value='deu')
    st.caption('Auto wählt die verfügbaren Backends für den Mac.')

    st.divider()
    st.caption('Backend-Status')
    for name, available in get_backend_status().items():
        st.write(f"{'✅' if available else '⚠️'} {name}")

uploaded_file = st.file_uploader('Lieferschein als Bild oder PDF hochladen', type=['png', 'jpg', 'jpeg', 'webp', 'tif', 'tiff', 'pdf'])
show_demo = st.button('Demo anzeigen', type='secondary', use_container_width=True)
run_button = st.button('Analysieren', type='primary', disabled=uploaded_file is None)

if show_demo:
    image, ocr_result, parsed = build_demo_result()
    render_analysis_result(image, ocr_result, parsed)
elif run_button and uploaded_file is not None:
    try:
        image = load_uploaded_image(uploaded_file)
        engine = build_engine(backend, model_id, ollama_model, language)
        ocr_result = engine.extract(image)
        parsed = parse_lieferschein(ocr_result.text, ocr_confidence=ocr_result.confidence)
        render_analysis_result(image, ocr_result, parsed)
    except Exception as exc:
        st.error(str(exc))
        st.exception(exc)
else:
    st.info('Lade einen Lieferschein hoch oder klicke auf "Demo anzeigen", um das Ergebnis zu sehen.')
