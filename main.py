import uvicorn
from backend.app.main import app

# Expose app object for `uvicorn main:app --reload --port 8000`
__all__ = ["app"]

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
