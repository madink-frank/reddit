from fastapi import FastAPI

app = FastAPI(title="Reddit API Test", version="1.0.0")

@app.get("/")
def read_root():
    return {"message": "Reddit Content Platform API is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "reddit-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)