from fastapi import FastAPI, HTTPException
import uvicorn
import os
from dotenv import load_dotenv
from contextlib import asynccontextmanager

from data_loader import load_tracks
from history_loader import load_user_history
from recommender import ContentBasedRecommender
from collaborative_recommender import CollaborativeRecommender 

load_dotenv()

# Global variables to hold model and data
content_recommender = ContentBasedRecommender()
collaborative_recommender = CollaborativeRecommender()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load data and train model on startup
    print("Loading track data...")
    df_tracks = load_tracks()
    if not df_tracks.empty:
        print("Training Content-Based model...")
        content_recommender.fit(df_tracks)
    else:
        print("WARNING: No track data loaded.")

    print("Loading user history...")
    df_history = load_user_history()
    if not df_history.empty:
        print(f"Loaded {len(df_history)} interaction pairs.")
        print("Training Collaborative Filtering model...")
        collaborative_recommender.fit(df_history)
    else:
        print("WARNING: No user history found. Collaborative filtering will be disabled until valid data is collected.")
        
    yield
    print("Shutting down...")

app = FastAPI(title="Music Recommendation Engine", lifespan=lifespan)

@app.get("/")
def read_root():
    return {"message": "Music Recommendation Engine is Running"}

@app.get("/health")
def health_check():
    return {
        "status": "ok", 
        "content_model": content_recommender.similarity_matrix is not None,
        "collaborative_model": collaborative_recommender.user_similarity_matrix is not None
    }

@app.post("/recommend/content-based")
def get_content_recommendations(track_id: str, limit: int = 5):
    """
    Get recommendations based on a single track ID (Find similar songs).
    """
    try:
        recommendations = content_recommender.recommend(track_id, n=limit)
        return {"track_id": track_id, "recommendations": recommendations}
    except Exception as e:
        # Return empty list instead of 500 if track not found, to be safe
        return {"track_id": track_id, "recommendations": []}

@app.post("/recommend/collaborative")
def get_collaborative_recommendations(user_id: str, limit: int = 5):
    """
    Get recommendations based on User History (Collaborative Filtering).
    """
    try:
        recommendations = collaborative_recommender.recommend(user_id, n=limit)
        return {"user_id": user_id, "recommendations": recommendations}
    except Exception as e:
        return {"user_id": user_id, "recommendations": []}

@app.post("/system/retrain")
def retrain_models():
    """
    Triggers a reload of data and retraining of both models.
    Use this endpoint for scheduled updates (Cron Jobs) or Admin Dashboard actions.
    """
    print("Manual Retrain Triggered...")
    
    # 1. Load Tracks & Retrain Content-Based
    df_tracks = load_tracks()
    if not df_tracks.empty:
        content_recommender.fit(df_tracks)
        print("Content-Based Model Updated.")
        
    # 2. Load History & Retrain Collaborative
    df_history = load_user_history()
    if not df_history.empty:
        collaborative_recommender.fit(df_history)
        print("Collaborative Model Updated.")
        
    return {"status": "success", "message": "Models retrained successfully"}


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
