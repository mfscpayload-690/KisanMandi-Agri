from fastapi import APIRouter
from backend.app.services.ingestion import IngestionManager

router = APIRouter(prefix="/api/v1/sync", tags=["Data Sync & Ingestion"])

@router.post("", summary="Trigger incremental AgMarkNet CSV data sync")
def trigger_sync():
    """
    Manually trigger incremental synchronization of new AgMarkNet CSV files
    added to the data directory. Employs multi-threaded file parsing.
    """
    manager = IngestionManager()
    result = manager.sync_new_reports()
    return result

@router.get("/status", summary="Get data ingestion and manifest status")
def get_sync_status():
    """Check which AgMarkNet reports have been ingested."""
    manager = IngestionManager()
    ingested = manager.get_ingested_files()
    return {
        "total_ingested_reports": len(ingested),
        "files": ingested
    }
