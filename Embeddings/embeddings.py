from sentence_transformers import SentenceTransformer
from pymongo import MongoClient
import numpy as np

model = SentenceTransformer('all-MiniLM-L6-v2')
client = MongoClient("mongodb://localhost:27017/")
db = client["news_db"]
collection = db["news"]

def compute_embeddings(text):
    articles = collection.find({}, {"_id": 1, "title": 1, "description": 1})
    for article in articles:
        content = f"{article['title']} {article['description']}"
        embeddings = model.encode(content)
        collection.update_one({"_id": article["_id"]}, {"$set": {"embedding": embeddings.tolist()}})

if __name__ == "__main__":
    compute_embeddings("news_db")


'''
    # Semantic search
    GET /search?q=artificial intelligence regulations&limit=10

    # Cluster all articles into 8 topic groups
    GET /clusters?n_clusters=8

    # Get recommendations for a specific article
    GET /recommend/abc123def456?limit=5
'''