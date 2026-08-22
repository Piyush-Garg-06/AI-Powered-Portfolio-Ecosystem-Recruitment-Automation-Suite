from typing import List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans

def cluster_repositories(repo_texts: List[str]) -> dict:
    """
    Groups repositories into primary skill clusters based on their descriptions.
    Uses TF-IDF for representation and K-Means for clustering.
    """
    cleaned_texts = [txt.strip() for txt in repo_texts if txt and txt.strip()]

    
    if not cleaned_texts:
        return {
            "clusters": []
        }

    # Dynamically select number of clusters based on count of repos
    # We shouldn't specify n_clusters > n_samples
    num_samples = len(cleaned_texts)
    n_clusters = min(3, num_samples)

    if n_clusters <= 1:
        # Trivial clustering when only 0 or 1 samples are present
        return {
            "clusters": [0] * num_samples
        }

    try:
        # Convert text to TF-IDF vectors
        vectorizer = TfidfVectorizer(stop_words='english', lowercase=True)
        X = vectorizer.fit_transform(cleaned_texts)

        # Run K-Means clustering
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init='auto')
        cluster_labels = kmeans.fit_predict(X)
        
        # Convert NumPy labels to standard list of Python integers
        clusters_list = [int(label) for label in cluster_labels]
    except Exception as e:
        print(f"Error during K-Means clustering: {e}")
        clusters_list = [0] * num_samples

    return {
        "clusters": clusters_list
    }
