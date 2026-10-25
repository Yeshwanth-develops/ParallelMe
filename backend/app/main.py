from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_sandbox import router as sandbox_router
from app.api.routes_evaluation import router as evaluation_router
from app.api.routes_tasks import router as tasks_router

app = FastAPI(
    title="ParallelMe API",
    description="Parallel Strategy Experimentation Engine",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sandbox_router)
app.include_router(evaluation_router)
app.include_router(tasks_router)


@app.get("/")
async def root():
    return {
        "app": "ParallelMe",
        "message": "ParallelMe API is running",
        "version": "0.1.0",
    }


@app.get("/api/health")
async def health():
    return {"status": "healthy"}



