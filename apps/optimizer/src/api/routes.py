"""REST API routes for optimization service."""
import uuid
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ..models.optimization_request import OptimizationRequest
from ..solvers.schedule_solver import ScheduleSolver

app = FastAPI(
    title="Resource Scheduler Optimization Service",
    description="OR-Tools based optimization service for schedule generation",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

solver = ScheduleSolver()


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    service: str
    version: str


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "optimization-service",
        "version": "1.0.0"
    }


@app.post("/optimize")
async def optimize(request: OptimizationRequest) -> Dict:
    """
    Optimize schedule assignments.
    
    Accepts optimization request and returns solution candidates.
    """
    try:
        # Generate optimization ID
        optimization_id = f"opt_{uuid.uuid4().hex[:8]}"
        
        # Solve
        result = solver.solve(request)
        
        # Format response
        return {
            "optimizationId": optimization_id,
            "status": result["status"],
            "solutions": result.get("solutions", []),
            "totalSolveTime": result.get("totalSolveTime", 0),
            "message": result.get("message", ""),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Optimization failed: {str(e)}"
        )


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "Resource Scheduler Optimization Service",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "optimize": "/optimize (POST)"
        }
    }

