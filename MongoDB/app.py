import os
import threading

# Set these BEFORE importing any ML libraries
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"

from contextlib import asynccontextmanager
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, Query, Request, HTTPException
from pymongo import MongoClient
from pydantic import BaseModel, Field
import uvicorn
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
from bson import ObjectId

from google import genai

gemini_client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

class NewsItem(BaseModel):
    id: str = Field(alias="_id")
    title: str
    url: str
    description: Optional[str] = ""
    date: Optional[str] = ""
    category: Optional[str] = "General News"
    source: str
    scraped_at: datetime

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda dt: dt.isoformat()}
    }

_MODEL_INSTANCE = None
_MODEL_LOCK = threading.Lock()

def get_transformer_model():
    global _MODEL_INSTANCE
    with _MODEL_LOCK:
        if _MODEL_INSTANCE is None:
            _MODEL_INSTANCE = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
        return _MODEL_INSTANCE


# ── Unified Lifespan Management ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.mongodb_client = MongoClient("mongodb://localhost:27017/")
    app.state.db = app.state.mongodb_client["news_db"]
    app.state.db["news"].create_index("scraped_at", expireAfterSeconds=604800)
    
    app.state.model = _MODEL_INSTANCE or get_transformer_model()
    yield
    app.state.mongodb_client.close() 

app = FastAPI(lifespan=lifespan)

# ── /news ─────────────────────────────────────────────────────────────────────
@app.get("/news", response_model=List[NewsItem])
def get_news(request: Request, category: Optional[str] = None, limit_per_source: int = 20):
    pipeline = []
    if category:
        pipeline.append({"$match": {"category": category}})
    pipeline.append({"$sort": {"scraped_at": -1}})
    pipeline.append({"$group": {"_id": "$source", "articles": {"$push": "$$ROOT"}}})
    pipeline.append({"$project": {"articles": {"$slice": ["$articles", limit_per_source]}}})
    pipeline.append({"$unwind": "$articles"})
    pipeline.append({"$replaceRoot": {"newRoot": "$articles"}})

    news_items = list(request.app.state.db["news"].aggregate(pipeline))
    for item in news_items:
        item["_id"] = str(item["_id"])
    return news_items

# ── /search ───────────────────────────────────────────────────────────────────
@app.get("/search")
def semantic_search(request: Request, q: str, limit: int = 10):
    try:
        db_collection = request.app.state.db["news"]
        query_vec = np.array(request.app.state.model.encode(q)).reshape(1, -1)
        
        articles = list(db_collection.find(
            {"embedding": {"$exists": True}},
            {"title": 1, "url": 1, "description": 1, "source": 1, "category": 1, "date": 1, "embedding": 1}
        ))
        if not articles:
            return []
            
        embeddings = np.array([a["embedding"] for a in articles])
        scores = cosine_similarity(query_vec, embeddings)[0]
        ranked = sorted(zip(scores, articles), key=lambda x: x[0], reverse=True)[:limit]
        
        results = []
        for score, article in ranked:
            article["_id"] = str(article["_id"])
            article["score"] = round(float(score), 4)
            article.pop("embedding", None)
            results.append(article)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")

# ── /clusters ─────────────────────────────────────────────────────────────────
@app.get("/clusters")
def cluster_articles(request: Request, n_clusters: int = 8):
    db_collection = request.app.state.db["news"]
    articles = list(db_collection.find(
        {"embedding": {"$exists": True}},
        {"title": 1, "source": 1, "category": 1, "embedding": 1}
    ))
    if len(articles) < n_clusters:
        raise HTTPException(status_code=400, detail=f"Not enough embedded articles — need at least {n_clusters}, have {len(articles)}")
        
    embeddings = np.array([a["embedding"] for a in articles])
    labels = KMeans(n_clusters=n_clusters, random_state=42, n_init="auto").fit_predict(embeddings)
    
    clusters = {}
    for label, article in zip(labels, articles):
        key = int(label)
        clusters.setdefault(key, []).append({
            "title": article.get("title"),
            "source": article.get("source"),
            "category": article.get("category"),
            "_id": str(article["_id"]),
        })
    return sorted(clusters.values(), key=len, reverse=True)

# ── /recommend ────────────────────────────────────────────────────────────────





# ── /trends ───────────────────────────────────────────────────────────────────



if __name__ == "__main__":
    # Pass 'app' directly as an object, not as a string "app:app"
    uvicorn.run(app, host="0.0.0.0", port=8000, loop="asyncio")