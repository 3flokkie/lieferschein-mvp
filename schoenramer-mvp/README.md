# Schönramer Lieferschein MVP

Lokaler MVP для распознавания Lieferscheine на MacBook с Apple Silicon.

## Структура

- `ocr_engine.py` - локальный OCR/vision backend с fallback-логикой
- `parser.py` - преобразование OCR-текста в JSON с confidence score
- `app.py` - Streamlit UI для загрузки сканов и проверки результата
- `artifacts/` - результаты, JSON, логи

## Запуск

```bash
pip install -r requirements.txt
streamlit run app.py
```

## Рекомендуемый локальный стек

- Ollama для быстрого локального vision backend
- Transformers на MPS для Florence-2 или Qwen2-VL
- Tesseract как fallback для простых сканов

## Пример потока

1. Загрузи скан или фото Lieferschein.
2. OCR engine извлекает текст.
3. Parser собирает JSON и помечает поля с низкой уверенностью.
4. UI показывает результат и дает скачать JSON.
