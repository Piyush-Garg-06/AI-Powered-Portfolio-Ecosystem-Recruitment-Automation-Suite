import numpy as np

try:
    from sentence_transformers import SentenceTransformer
    print("Loading SentenceTransformer model 'all-MiniLM-L6-v2' in ats_engine.py...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    print("SentenceTransformer 'all-MiniLM-L6-v2' loaded successfully.")
    HAS_SENTENCE_TRANSFORMERS = True
except Exception as e:
    print(f"SentenceTransformer not available ({e}), falling back to TF-IDF vectorizer.")
    HAS_SENTENCE_TRANSFORMERS = False
    from sklearn.feature_extraction.text import TfidfVectorizer

def calculate_ats_match(candidate_text: str, jd_text: str) -> dict:
    """Encodes candidate details and JD into dense embeddings and computes cosine similarity."""
    if not candidate_text.strip() or not jd_text.strip():
        return {
            "match_percentage": 0.0,
            "raw_cosine_score": 0.0
        }

    if HAS_SENTENCE_TRANSFORMERS:
        # Encode texts to embeddings
        embeddings = model.encode([candidate_text, jd_text])
        u = embeddings[0]
        v = embeddings[1]
    else:
        # TF-IDF Fallback
        vectorizer = TfidfVectorizer()
        tfidf = vectorizer.fit_transform([candidate_text, jd_text])
        dense = tfidf.todense()
        u = np.array(dense[0]).flatten()
        v = np.array(dense[1]).flatten()

    # Compute Cosine Similarity: dot(u, v) / (norm(u) * norm(v))
    dot_product = np.dot(u, v)
    norm_u = np.linalg.norm(u)
    norm_v = np.linalg.norm(v)

    if norm_u == 0.0 or norm_v == 0.0:
        cosine_score = 0.0
    else:
        cosine_score = float(dot_product / (norm_u * norm_v))

    # Convert to match percentage (scale 0-1 to 0-100)
    match_percentage = max(0.0, cosine_score) * 100.0

    return {
        "match_percentage": round(match_percentage, 2),
        "raw_cosine_score": round(cosine_score, 4)
    }
