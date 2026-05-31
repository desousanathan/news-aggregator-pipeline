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

import os

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
    db_collection = request.app.state.db["news"]  # Added .state
    query_vec = np.array(request.app.state.model.encode(q)).reshape(1, -1) # Added .state
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
@app.get("/recommend/{article_id}")
def recommend(request: Request, article_id: str, limit: int = 5):
    db_collection = request.app.state.db["news"]
    
    # Safe BSON processing to prevent application crash on malformed ObjectIds
    try:
        query_id = ObjectId(article_id) if ObjectId.is_valid(article_id) else article_id
    except Exception:
        query_id = article_id

    source = db_collection.find_one({"_id": query_id})
    if not source or "embedding" not in source:
        raise HTTPException(status_code=404, detail="Article not found or not yet embedded")
        
    source_vec = np.array(source["embedding"]).reshape(1, -1)
    others = list(db_collection.find(
        {"embedding": {"$exists": True}, "_id": {"$ne": source["_id"]}},
        {"title": 1, "url": 1, "description": 1, "source": 1, "category": 1, "date": 1, "embedding": 1}
    ))
    if not others:
        return []
        
    embeddings = np.array([a["embedding"] for a in others])
    scores = cosine_similarity(source_vec, embeddings)[0]
    ranked = sorted(zip(scores, others), key=lambda x: x[0], reverse=True)[:limit]
    
    results = []
    for score, article in ranked:
        article["_id"] = str(article["_id"])
        article["score"] = round(float(score), 4)
        article.pop("embedding", None)
        results.append(article)
    return results


@app.get("/chat")
def chat(request: Request, q: str, limit: int = 5):
    query_vec = np.array(request.app.state.model.encode(q)).reshape(1, -1)
    db_collection = request.app.state.db["news"]
    articles = list(db_collection.find(
        {"embedding": {"$exists": True}},
        {"title": 1, "description": 1, "url": 1, "source": 1, "embedding": 1}
    ))

    if not articles:
        return {"answer": "No articles found in the database.", "sources": []}

    embeddings = np.array([a["embedding"] for a in articles])
    if embeddings.ndim == 1:
        embeddings = embeddings.reshape(1, -1)

    scores = cosine_similarity(query_vec, embeddings)[0]
    top = sorted(zip(scores, articles), key=lambda x: x[0], reverse=True)[:limit]

    context = "\n\n".join([
        f"- {a['title']} ({a['source']}): {a.get('description', '')}"
        for _, a in top
    ])

    try:
        response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"You are a news assistant. Answer using only the provided articles.\n\nArticles:\n{context}\n\nQuestion: {q}"
        )
        answer = response.text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini error: {str(e)}")

    return {
        "answer": answer,
        "sources": [{"title": a["title"], "url": a["url"]} for _, a in top]
    }




# ── /trends ───────────────────────────────────────────────────────────────────
@app.get("/trends")
def get_trends(request: Request, hours: int = 24):
    from datetime import timezone, timedelta
    db = request.app.state.db["news"]
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    pipeline = [
        {"$match": {"scraped_at": {"$gte": since}}},
        {"$group": {
            "_id": "$category",
            "count": {"$sum": 1},
            "sources": {"$addToSet": "$source"}
        }},
        {"$sort": {"count": -1}}
    ]
    results = list(db.aggregate(pipeline))
    return [{"category": r["_id"], "count": r["count"], "sources": r["sources"]} for r in results]
 
# ── /trends/keywords ──────────────────────────────────────────────────────────
@app.get("/trends/keywords")
def trending_keywords(request: Request, hours: int = 24, top_n: int = 20):
    from collections import Counter
    from datetime import timezone, timedelta
    import re
 
    STOPWORDS = {
        "the","a","an","in","of","to","and","for","is","on","at","by","with",
        "that","this","from","are","was","were","has","have","been","will",
        "its","it","as","be","but","or","not","over","after","amid","than",
        "more","new","says","said","after","into","about","their","they",
        "what","who","how","when","where","which","your","our","his","her",
    }
 
    db = request.app.state.db["news"]
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    articles = list(db.find({"scraped_at": {"$gte": since}}, {"title": 1}))
 
    words = []
    for a in articles:
        tokens = re.findall(r'\b[a-zA-Z]{4,}\b', a.get("title", "").lower())
        words.extend([w for w in tokens if w not in STOPWORDS])
 
    counts = Counter(words).most_common(top_n)
    return [{"word": w, "count": c} for w, c in counts]
 
# ── /trends/volume ────────────────────────────────────────────────────────────
@app.get("/trends/volume")
def volume_over_time(request: Request, hours: int = 24, bucket_hours: int = 1):
    from datetime import timezone, timedelta
    db = request.app.state.db["news"]
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    pipeline = [
        {"$match": {"scraped_at": {"$gte": since}}},
        {"$group": {
            "_id": {
                "$dateTrunc": {"date": "$scraped_at", "unit": "hour", "binSize": bucket_hours}
            },
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    results = list(db.aggregate(pipeline))
    return [{"time": r["_id"].isoformat(), "count": r["count"]} for r in results]

if __name__ == "__main__":
    # Pass 'app' directly as an object, not as a string "app:app"
    uvicorn.run(app, host="0.0.0.0", port=8000, loop="asyncio")