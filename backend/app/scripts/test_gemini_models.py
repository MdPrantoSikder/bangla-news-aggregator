from google import genai
from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

models_to_try = [
    "gemini-2.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-2.5-flash",
    "gemini-flash-latest",
]

for model in models_to_try:
    print(f"\n=== Testing {model} ===")
    try:
        r = client.models.generate_content(
            model=model,
            contents="Say PONG and nothing else."
        )
        print(f"  SUCCESS: {r.text.strip()}")
    except Exception as e:
        msg = str(e)
        if "429" in msg:
            print(f"  QUOTA EXHAUSTED (429)")
        elif "404" in msg:
            print(f"  NOT FOUND (404)")
        else:
            print(f"  OTHER ERROR: {msg[:200]}")
