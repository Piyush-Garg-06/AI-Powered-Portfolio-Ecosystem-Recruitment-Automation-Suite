import os
import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

def train_and_save_models():
    # --- 1. Train Role Classifier ---
    role_data = [
        # Frontend Engineer
        ("React components, Redux state management, HTML5, CSS3, Tailwind CSS styling, building responsive web UI interfaces.", "Frontend Engineer"),
        ("Frontend web development using Vue.js, Vuex, JavaScript, TypeScript, styling websites, Sass, Bootstrap, and Figma design.", "Frontend Engineer"),
        ("Single Page Applications (SPA), Next.js framework, client-side rendering, styling landing page, UI/UX optimization, Webpack.", "Frontend Engineer"),
        ("Creating interactive user experiences, web performance, component libraries, design systems, HTML/CSS animations, Angular framework.", "Frontend Engineer"),
        
        # Backend Engineer
        ("Node.js runtime, Express.js microservice architecture, PostgreSQL database, SQL queries, RESTful APIs, backend server engineering.", "Backend Engineer"),
        ("Python Django, Flask frameworks, MongoDB database optimization, backend security authentication, GraphQL API design, database schemas.", "Backend Engineer"),
        ("Java Spring Boot backend developer, writing unit tests, microservices, MySQL database operations, backend routing, gRPC protocols.", "Backend Engineer"),
        ("Go language server implementation, concurrency routines, REST APIs, Redis cache configuration, server side scripting, backend controllers.", "Backend Engineer"),
        
        # Full-Stack Developer
        ("MERN stack (MongoDB, Express, React, Node.js) full-stack web application development, frontend backend integration.", "Full-Stack Developer"),
        ("Full stack development with Next.js and PostgreSQL. Designing both UI layouts and database middleware backend logic.", "Full-Stack Developer"),
        ("MEAN stack, fullstack developer building dashboards, integrating payment gateways, database migrations, and responsive frontends.", "Full-Stack Developer"),
        ("Developing entire web applications from scratch, handling database layer, Express routing, and React state management.", "Full-Stack Developer"),
        
        # AI/ML Engineer
        ("Machine learning models, training PyTorch neural networks, TensorFlow deep learning architectures, computer vision, OpenCV.", "AI/ML Engineer"),
        ("Natural Language Processing (NLP), transformers models, Hugging Face, data pre-processing, pandas dataframes, scikit-learn pipeline.", "AI/ML Engineer"),
        ("Data science, linear regression, random forest classifier, predictive modeling, fine-tuning LLMs, Groq API, AI applications.", "AI/ML Engineer"),
        ("Artificial Intelligence development, reinforcement learning, training datasets, CNN, RNN, model inference optimizations.", "AI/ML Engineer"),
        
        # DevOps Specialist
        ("DevOps pipeline setup, CI/CD automated test workflows, Github Actions, Docker container orchestration, Kubernetes cluster management.", "DevOps Specialist"),
        ("AWS cloud infrastructure configuration, Terraform Infrastructure as Code (IaC), AWS EC2, S3 bucket storage, server deployment.", "DevOps Specialist"),
        ("Dockerizing applications, DevOps pipelines, Jenkins build automation, shell scripting in bash, Linux server configuration, Nginx setup.", "DevOps Specialist"),
        ("Kubernetes orchestration, Prometheus monitoring, automated deployments on GCP, cloud security compliance, DevOps workflows.", "DevOps Specialist"),
    ]

    X_role = [item[0] for item in role_data]
    y_role = [item[1] for item in role_data]

    role_pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(lowercase=True, stop_words='english', ngram_range=(1, 2))),
        ('clf', LogisticRegression(C=1.0, max_iter=200, random_state=42))
    ])

    print("Training Developer Role Classifier...")
    role_pipeline.fit(X_role, y_role)

    # --- 2. Train Hiring Intent Scaler & Logistic Regression ---
    # Features: [dwell_time, audit_views, ats_checks, chat_queries]
    intent_data = np.array([
        [10.0, 0, 0, 0],   # No interest
        [20.0, 1, 0, 0],   # Low interest
        [5.0, 0, 0, 0],    # No interest
        [15.0, 0, 1, 0],   # Low interest
        [120.0, 3, 2, 2],  # High interest
        [300.0, 5, 4, 3],  # High interest
        [450.0, 8, 6, 5],  # High interest
        [80.0, 2, 1, 1],   # Medium-High interest
        [45.0, 1, 1, 0],   # Low-Medium interest
        [600.0, 10, 8, 8], # Extremely high interest
    ])
    intent_labels = np.array([0, 0, 0, 0, 1, 1, 1, 1, 0, 1])

    scaler = StandardScaler()
    scaled_intent = scaler.fit_transform(intent_data)

    intent_model = LogisticRegression(random_state=42)
    intent_model.fit(scaled_intent, intent_labels)

    print("Hiring Intent model coefficients:", intent_model.coef_[0])
    print("Hiring Intent model intercept:", intent_model.intercept_[0])

    # --- 3. Save Models ---
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    os.makedirs(models_dir, exist_ok=True)

    joblib.dump(role_pipeline, os.path.join(models_dir, 'role_classifier.pkl'))
    joblib.dump(scaler, os.path.join(models_dir, 'intent_scaler.pkl'))
    
    # Also save the coefficients/intercept as a dictionary parameters file
    joblib.dump({
        'coef': intent_model.coef_[0],
        'intercept': intent_model.intercept_[0]
    }, os.path.join(models_dir, 'intent_model_params.pkl'))

    print("All models trained and saved successfully!")

if __name__ == "__main__":
    train_and_save_models()
