import os
import sys
import json
import base64
import tempfile
import joblib
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

# Add current directory to path for modules imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from modules.code_analyzer import audit_code
from modules.ats_engine import calculate_ats_match
from modules.audio_analyzer import analyze_vocal_telemetry
from modules.vision_proctor import analyze_frame_gaze
from modules.repo_cluster import cluster_repositories

app = Flask(__name__)
# Enable CORS for all microservice cross-communications
CORS(app)

# Load machine learning models and parameters
models_dir = os.path.join(os.path.dirname(__file__), 'models')
role_model_path = os.path.join(models_dir, 'role_classifier.pkl')
scaler_path = os.path.join(models_dir, 'intent_scaler.pkl')
params_path = os.path.join(models_dir, 'intent_model_params.pkl')

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "service": "DevScale Python AI/ML Engine"}), 200

@app.route("/api/ml/code-audit", methods=["POST"])
def api_code_audit():
    """Proxies request to Radon analyzer module."""
    try:
        data = request.get_json() or {}
        # Support both 'code' and 'raw_code' keys for backward compatibility
        code_content = data.get("code", data.get("raw_code", ""))
        
        result = audit_code(code_content)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": f"Code analyzer runtime failure: {str(e)}", "status": 500}), 500

@app.route("/api/ml/ats-match", methods=["POST"])
def api_ats_match():
    """Proxies request to ATS match engine module and generates reasoning/gaps locally."""
    try:
        data = request.get_json() or {}
        candidate_text = data.get("candidate_text", "")
        jd_text = data.get("jd_text", "")
        
        result = calculate_ats_match(candidate_text, jd_text)
        match_percentage = result.get("match_percentage", 0.0)
        
        # Local keyword checking for strengths & gaps
        tech_keywords = [
            "React", "Vue", "Angular", "Next.js", "Node.js", "Express", "Django", "Flask",
            "FastAPI", "Spring Boot", "Ruby on Rails", "Laravel", "ASP.NET", "MongoDB",
            "PostgreSQL", "MySQL", "SQL Server", "SQLite", "Redis", "Elasticsearch",
            "Cassandra", "DynamoDB", "AWS", "GCP", "Azure", "Docker", "Kubernetes", "CI/CD",
            "Git", "GitHub", "Jenkins", "Terraform", "Ansible", "Python", "JavaScript",
            "TypeScript", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "HTML", "CSS",
            "Tailwind CSS", "Bootstrap", "Redux", "Zustand", "GraphQL", "REST API"
        ]
        
        jd_words = jd_text.lower()
        cand_words = candidate_text.lower()
        
        jd_techs = [t for t in tech_keywords if t.lower() in jd_words]
        strengths = [t for t in jd_techs if t.lower() in cand_words]
        gaps = [t for t in jd_techs if t.lower() not in cand_words]
        
        # Build local reasoning string
        reasoning = f"The candidate profile shows a strong semantic alignment score of {match_percentage}%."
        if strengths:
            reasoning += f" Key areas of strength include direct alignment on core technologies: {', '.join(strengths[:3])}."
        if gaps:
            reasoning += f" To fully align with the requirements, the candidate could bridge gaps in: {', '.join(gaps[:3])}."
        else:
            reasoning += " No significant technology gaps were identified relative to the job description."
            
        result["reasoning"] = reasoning
        result["strengths"] = strengths[:4]
        result["missingTechOrGaps"] = gaps[:4]
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": f"ATS matching failure: {str(e)}", "status": 500}), 500

@app.route("/api/ml/audio-analysis", methods=["POST"])
def api_audio_analysis():
    """Receives audio file or base64 buffer and analyzes voice telemetry."""
    try:
        transcript = ""
        duration_sec = 0.0
        tmp_path = None

        # 1. Handle multipart form-data upload
        if request.files:
            audio_file = request.files.get("file") or request.files.get("audio")
            transcript = request.form.get("transcript", "")
            duration_sec = float(request.form.get("duration_sec", 0.0))
            
            if audio_file:
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                    audio_file.save(tmp.name)
                    tmp_path = tmp.name
        else:
            # 2. Handle base64 buffer in JSON request
            data = request.get_json() or {}
            transcript = data.get("transcript", "")
            duration_sec = float(data.get("duration_sec", 0.0))
            audio_base64 = data.get("audio") or data.get("audio_base64")

            if audio_base64:
                # Remove data url header if present
                if "," in audio_base64:
                    audio_base64 = audio_base64.split(",")[1]
                audio_bytes = base64.b64decode(audio_base64)
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                    tmp.write(audio_bytes)
                    tmp_path = tmp.name

        # 3. Process analysis
        if tmp_path:
            try:
                result = analyze_vocal_telemetry(tmp_path, transcript, duration_sec)
            finally:
                # Always remove temp file
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass
        else:
            # Fallback to transcript-only metrics if no audio data sent
            result = analyze_vocal_telemetry(None, transcript, duration_sec)

        # Include delivery_score key for backward compatibility
        result["delivery_score"] = result.get("speech_delivery_score", 100.0)
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": f"Audio analysis failure: {str(e)}", "status": 500}), 500

@app.route("/api/ml/speech-proctor", methods=["POST"])
def api_speech_proctor_legacy():
    """Legacy endpoint mapping directly to audio analyzer logic for backward compatibility."""
    try:
        data = request.get_json() or {}
        transcript = data.get("transcript", "")
        duration_sec = float(data.get("duration_sec", 0.0))
        
        result = analyze_vocal_telemetry(None, transcript, duration_sec)
        result["delivery_score"] = result.get("speech_delivery_score", 100.0)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": f"Speech proctor legacy service failure: {str(e)}", "status": 500}), 500

@app.route("/api/ml/classify-role", methods=["POST"])
def api_classify_role():
    """Predicts developer role from repository texts using the trained Logistic Regression pipeline."""
    try:
        data = request.get_json() or {}
        repo_texts = data.get("repo_texts", [])
        
        combined_text = " ".join([txt for txt in repo_texts if txt and txt.strip()])
        if not combined_text.strip():
            return jsonify({
                "predicted_role": "Full-Stack Developer",
                "confidence_score": 1.0,
                "probability": 1.0
            }), 200

        # Load role classifier pipeline
        if not os.path.exists(role_model_path):
            return jsonify({"error": "Role classifier model not found. Run train_models.py first."}), 500
        
        model = joblib.load(role_model_path)
        prediction = model.predict([combined_text])[0]
        probabilities = model.predict_proba([combined_text])[0]
        class_idx = list(model.classes_).index(prediction)
        confidence = float(probabilities[class_idx])

        return jsonify({
            "predicted_role": prediction,
            "confidence_score": round(confidence, 2),
            "probability": round(confidence, 2)
        }), 200
    except Exception as e:
        return jsonify({"error": f"Role classification failure: {str(e)}", "status": 500}), 500

@app.route("/api/ml/cluster-repos", methods=["POST"])
def api_cluster_repos():
    """Groups projects into clusters."""
    try:
        data = request.get_json() or {}
        repo_texts = data.get("repo_texts", []) or data.get("descriptions", [])
        
        result = cluster_repositories(repo_texts)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": f"Repository clustering failure: {str(e)}", "status": 500}), 500

@app.route("/api/ml/hiring-intent", methods=["POST"])
def api_hiring_intent():
    """
    Receives tracking counts, scales metrics using StandardScaler,
    applies W^T * X + b Logistic Regression formula, and returns probability.
    """
    try:
        data = request.get_json() or {}
        dwell_time = float(data.get("dwell_time", 0.0))
        audit_views = int(data.get("audit_views", 0))
        ats_checks = int(data.get("ats_checks", 0))
        chat_queries = int(data.get("chat_queries", 0))

        # Check model files existence
        if not os.path.exists(scaler_path) or not os.path.exists(params_path):
            return jsonify({"error": "Hiring intent parameters or scaler missing. Run train_models.py."}), 500

        scaler = joblib.load(scaler_path)
        params = joblib.load(params_path)

        W = params['coef']
        b = params['intercept']

        # Construct vector and scale it
        X = np.array([[dwell_time, audit_views, ats_checks, chat_queries]])
        X_scaled = scaler.transform(X)[0]

        # Calculate logit: W^T * X + b
        logit = np.dot(W, X_scaled) + b

        # Sigmoid: 1 / (1 + exp(-logit))
        probability = 1.0 / (1.0 + np.exp(-logit))
        hiring_probability_percent = round(float(probability) * 100.0, 2)

        return jsonify({
            "hiring_probability": hiring_probability_percent,
            "scaled_features": X_scaled.tolist()
        }), 200
    except Exception as e:
        return jsonify({"error": f"Hiring intent calculation failure: {str(e)}", "status": 500}), 500

@app.route("/api/ml/vision-proctor", methods=["POST"])
def api_vision_proctor():
    """Runs gaze tracking on base64 frame."""
    try:
        data = request.get_json() or {}
        frame_base64 = data.get("frame") or data.get("image")
        
        frame_bytes = None
        if frame_base64:
            if "," in frame_base64:
                frame_base64 = frame_base64.split(",")[1]
            frame_bytes = base64.b64decode(frame_base64)
        
        result = analyze_frame_gaze(frame_bytes=frame_bytes)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": f"Vision proctor failure: {str(e)}", "status": 500}), 500

import requests

def load_backend_env():
    """Load the shared backend env file when this service runs independently."""
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend", ".env")
    if not os.path.exists(env_path):
        return
    try:
        with open(env_path, encoding="utf-8") as env_file:
            for line in env_file:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                key = key.strip()
                if key == "GROQ_API_KEY":
                    os.environ.setdefault(key, value.strip().strip('"').strip("'"))
    except OSError as error:
        print(f"Could not read shared backend env: {error}")

load_backend_env()

def call_groq_completions(system_prompt, user_content="", temperature=0.7, json_mode=False):
    """Auxiliary routine to execute Llama LLM tasks securely on the Python AI service."""
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        print("Groq API key is missing. Set GROQ_API_KEY before starting the AI engine.")
        return None
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "groq/compound",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        "temperature": temperature
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}
        
    try:
        res = requests.post(url, headers=headers, json=payload, timeout=25)
        res_json = res.json()
        if "choices" not in res_json:
            print("[ERROR] Groq API returned error payload:", res_json)
        return res_json["choices"][0]["message"]["content"]
    except Exception as e:
        print("[ERROR] Python Groq proxy execution error:", str(e))
        return None

from modules.ats_engine import model
import re

QUESTION_BANK = {
    "react": [
        {
            "id": 1,
            "topic": "Frontend Performance",
            "question": "How do you optimize render performance and prevent re-renders in React virtual DOM?",
            "expectedKeywords": ["usememo", "usecallback", "memo", "re-render", "virtual dom"]
        },
        {
            "id": 2,
            "topic": "State Management",
            "question": "What are the trade-offs between using React Context API and Redux for global state?",
            "expectedKeywords": ["context", "redux", "state", "store", "boilerplate", "prop drilling"]
        }
    ],
    "node": [
        {
            "id": 3,
            "topic": "NodeJS Concurrency",
            "question": "How does NodeJS single-threaded event loop handle CPU-intensive tasks without blocking?",
            "expectedKeywords": ["event loop", "worker threads", "non-blocking", "cluster", "asynchronous"]
        },
        {
            "id": 4,
            "topic": "API Middleware",
            "question": "How do you secure your Express API routes against brute-force attacks and SQL injection?",
            "expectedKeywords": ["middleware", "rate limit", "sql injection", "helmet", "sanitization"]
        }
    ],
    "mongo": [
        {
            "id": 5,
            "topic": "Database Indexing",
            "question": "When should you use compound indexes in MongoDB, and how do they affect write performance?",
            "expectedKeywords": ["compound index", "write overhead", "query planner", "indexing"]
        },
        {
            "id": 6,
            "topic": "Schema Design",
            "question": "How do you choose between embedding documents and referencing them in Mongoose schema design?",
            "expectedKeywords": ["embed", "reference", "document size", "joins", "populate"]
        }
    ],
    "python": [
        {
            "id": 7,
            "topic": "Python GIL",
            "question": "How does the Python Global Interpreter Lock affect CPU-bound multithreaded applications?",
            "expectedKeywords": ["gil", "multiprocessing", "cpu-bound", "concurrency", "interpreter"]
        },
        {
            "id": 8,
            "topic": "Async Programming",
            "question": "How does asyncio in Python differ from traditional multithreading for I/O operations?",
            "expectedKeywords": ["asyncio", "coroutine", "event loop", "non-blocking", "await"]
        }
    ],
    "javascript": [
        {
            "id": 9,
            "topic": "JS Closures",
            "question": "How do closures work in JavaScript, and what are their typical use cases and memory leak risks?",
            "expectedKeywords": ["closure", "lexical scope", "memory leak", "garbage collection"]
        },
        {
            "id": 10,
            "topic": "Asynchronous JS",
            "question": "What is the difference between Promises and async/await in handling async callbacks?",
            "expectedKeywords": ["promise", "async/await", "callback hell", "syntax sugar", "try/catch"]
        }
    ],
    "general": [
        {
            "id": 11,
            "topic": "RESTful Design",
            "question": "What are the core design principles of RESTful APIs, and how do you version endpoints?",
            "expectedKeywords": ["rest", "stateless", "http methods", "versioning", "uri"]
        },
        {
            "id": 12,
            "topic": "Error Handling",
            "question": "What is your approach to centralized error handling and logging in production systems?",
            "expectedKeywords": ["try-catch", "centralized", "logging", "winston", "middleware"]
        },
        {
            "id": 13,
            "topic": "Git Workflow",
            "question": "Explain your preferred branching strategy when collaborating with other developers.",
            "expectedKeywords": ["git flow", "merge request", "pull request", "rebase", "conflict"]
        },
        {
            "id": 14,
            "topic": "Security Best Practices",
            "question": "How do you securely manage env variables, passwords, and tokens in a production codebase?",
            "expectedKeywords": ["env", "hashing", "bcrypt", "dotenv", "secret manager"]
        }
    ]
}

def extract_projects_from_prompt(prompt: str) -> list:
    try:
        match = re.search(r'\[\s*\{.*\}\s*\]', prompt, re.DOTALL)
        if match:
            return json.loads(match.group(0))
    except Exception:
        pass
    return []

def extract_evaluation_inputs(prompt: str) -> tuple:
    question = ""
    expected_keywords = []
    user_answer = ""
    
    q_match = re.search(r'Question:\s*"([^"]*)"', prompt)
    if q_match:
        question = q_match.group(1)
        
    kw_match = re.search(r'Expected Keywords:\s*(\[[^\]]*\])', prompt)
    if kw_match:
        try:
            expected_keywords = json.loads(kw_match.group(1))
        except Exception:
            pass
            
    ua_match = re.search(r"Candidate's Answer:\s*\"([^\"]*)\"", prompt)
    if ua_match:
        user_answer = ua_match.group(1)
    else:
        ua_match_alt = re.search(r"Candidate's Answer:\s*([\s\S]*)", prompt)
        if ua_match_alt:
            user_answer = ua_match_alt.group(1).strip()
            
    return question, expected_keywords, user_answer

def extract_code_metrics(prompt: str) -> tuple:
    cc = 1.0
    mi = 100.0
    grade = "A"
    warnings = []
    
    cc_match = re.search(r'Cyclomatic Complexity:\s*([0-9.]+)', prompt)
    if cc_match:
        cc = float(cc_match.group(1))
        
    mi_match = re.search(r'Maintainability Index:\s*([0-9.]+)', prompt)
    if mi_match:
        mi = float(mi_match.group(1))
        
    grade_match = re.search(r'Security Risk Grade:\s*([A-F])', prompt)
    if grade_match:
        grade = grade_match.group(1)
        
    warn_match = re.search(r'Warnings:\s*(\[[^\]]*\])', prompt)
    if warn_match:
        try:
            warnings = json.loads(warn_match.group(1))
        except Exception:
            pass
            
    return cc, mi, grade, warnings

def extract_intent_metrics(prompt: str) -> tuple:
    dwell = 0.0
    audits = 0
    ats = 0
    chats = 0
    
    dwell_match = re.search(r'Dwell Time:\s*([0-9.]+)', prompt)
    if dwell_match:
        dwell = float(dwell_match.group(1))
        
    audits_match = re.search(r'Audit Views:\s*([0-9]+)', prompt)
    if audits_match:
        audits = int(audits_match.group(1))
        
    ats_match = re.search(r'ATS Checks:\s*([0-9]+)', prompt)
    if ats_match:
        ats = int(ats_match.group(1))
        
    chats_match = re.search(r'Chat Queries:\s*([0-9]+)', prompt)
    if chats_match:
        chats = int(chats_match.group(1))
        
    return dwell, audits, ats, chats

def extract_roadmap_inputs(prompt: str) -> tuple:
    role = "Full-Stack Developer"
    tech_stack = []
    
    role_match = re.search(r"Role:\s*([^\n]*)", prompt)
    if role_match:
        role = role_match.group(1).strip()
        
    tech_match = re.search(r"Technologies:\s*([^\n]*)", prompt)
    if tech_match:
        tech_stack = [t.strip() for t in tech_match.group(1).split(",") if t.strip()]
        
    return role, tech_stack

def generate_project_based_question(project, question_idx):
    title = project.get("title", "Project")
    lang = project.get("language", "Core Technology")
    
    if not lang:
        lang = "JavaScript/Python"
        
    topic = f"Project: {title}"
    
    # Generate tailored technical architecture questions
    if question_idx == 0:
        question = f"In your project '{title}', how did you structure the {lang} architecture to decouple components?"
        expected = [title.lower(), lang.lower(), "architecture", "component", "structure"]
    elif question_idx == 1:
        question = f"What state management or data persistence strategy was used in your project '{title}'?"
        expected = [title.lower(), "state", "persistence", "database", "store"]
    elif question_idx == 2:
        question = f"How did you handle error boundaries and exception logging in your application '{title}'?"
        expected = [title.lower(), "error", "exception", "logging", "debug"]
    else:
        question = f"How does your project '{title}' optimize API performance or query speeds under stress?"
        expected = [title.lower(), "api", "performance", "query", "optimize"]
        
    return {
        "id": question_idx + 1,
        "topic": topic,
        "question": question,
        "expectedKeywords": expected
    }

@app.route("/api/ml/llm/interview/generate", methods=["POST"])
def api_llm_interview_generate():
    try:
        data = request.get_json() or {}
        system_prompt = data.get("system_prompt", "")
        
        projects = extract_projects_from_prompt(system_prompt)
        
        final_questions = []
        
        # 1. Try to generate questions based on synced projects
        if projects:
            num_projects = len(projects)
            for idx in range(4):
                proj = projects[idx % num_projects]
                q = generate_project_based_question(proj, idx)
                final_questions.append(q)
        else:
            # Fall back to matched categories or general questions
            # Analyze tech stack of developer
            matched_categories = set()
            for p in projects:
                title = (p.get("title") or "").lower()
                desc = (p.get("description") or "").lower()
                lang = (p.get("language") or "").lower()
                
                if "react" in title or "react" in desc or "frontend" in title or "frontend" in desc:
                    matched_categories.add("react")
                if "node" in title or "node" in desc or "backend" in title or "backend" in desc:
                    matched_categories.add("node")
                if "mongo" in title or "mongo" in desc or "database" in title or "database" in desc:
                    matched_categories.add("mongo")
                if "python" in title or "python" in lang or "django" in title or "flask" in title:
                    matched_categories.add("python")
                if "javascript" in title or "javascript" in lang or "typescript" in title or "ts" in lang:
                    matched_categories.add("javascript")
                    
            # Select questions from matched categories
            selected = []
            for cat in matched_categories:
                if cat in QUESTION_BANK:
                    selected.extend(QUESTION_BANK[cat])
                    
            # Fill remaining with general questions if not enough questions selected
            if len(selected) < 4:
                for q in QUESTION_BANK["general"]:
                    if q not in selected:
                        selected.append(q)
                        
            # Guarantee exactly 4 unique questions and format response
            unique_selected = []
            for q in selected:
                if q not in unique_selected:
                    unique_selected.append(q)
            
            final_questions = unique_selected[:4]
            for idx, q in enumerate(final_questions):
                q["id"] = idx + 1
            
        reply = json.dumps(final_questions)
        return jsonify({"reply": reply}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/ml/llm/interview/evaluate", methods=["POST"])
def api_llm_interview_evaluate():
    try:
        data = request.get_json() or {}
        system_prompt = data.get("system_prompt", "")
        
        question, expected_keywords, user_answer = extract_evaluation_inputs(system_prompt)
        
        if not user_answer or user_answer.strip() == "" or "no spoken response" in user_answer.lower():
            reply = json.dumps({
                "accuracy": 0,
                "feedback": "No technical response was recorded for this question.",
                "flaw": "Missing response details."
            })
            return jsonify({"reply": reply}), 200
            
        # Calculate keyword match score
        matched = [kw for kw in expected_keywords if kw.lower() in user_answer.lower()]
        missed = [kw for kw in expected_keywords if kw.lower() not in user_answer.lower()]
        
        kw_score = (len(matched) / len(expected_keywords)) * 100 if expected_keywords else 100
        
        # Calculate semantic embedding score using local SentenceTransformer model
        target_text = question + " " + " ".join(expected_keywords)
        embeddings = model.encode([user_answer, target_text])
        u = embeddings[0]
        v = embeddings[1]
        
        dot_prod = np.dot(u, v)
        norm_u = np.linalg.norm(u)
        norm_v = np.linalg.norm(v)
        
        similarity = float(dot_prod / (norm_u * norm_v)) if norm_u > 0 and norm_v > 0 else 0.0
        semantic_score = max(0.0, similarity) * 100
        
        # Combined accuracy score
        accuracy_score = round((kw_score * 0.4) + (semantic_score * 0.6))
        
        # Handle brief responses
        if len(user_answer.split()) < 4:
            accuracy_score = min(25, accuracy_score)
            
        # Generate feedback & flaws locally
        if accuracy_score >= 80:
            feedback = f"Excellent technical explanation. You successfully addressed: {', '.join(matched)}."
            flaw = ""
        elif accuracy_score >= 50:
            feedback = f"Reasonable response. You correctly covered {', '.join(matched)} but missed {', '.join(missed)}."
            flaw = f"Missed mentioning: {', '.join(missed)}"
        else:
            feedback = f"Incomplete explanation. You missed explaining core concepts like {', '.join(missed)}."
            flaw = f"Failed to cover: {', '.join(missed)}"
            
        reply = json.dumps({
            "accuracy": accuracy_score,
            "feedback": feedback,
            "flaw": flaw
        })
        return jsonify({"reply": reply}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/ml/llm/roadmap/generate", methods=["POST"])
def api_llm_roadmap_generate():
    try:
        data = request.get_json() or {}
        system_prompt = data.get("system_prompt", "")
        
        role, tech_stack = extract_roadmap_inputs(system_prompt)
        role_lower = role.lower()
        
        if "backend" in role_lower:
            milestones = [
                {"milestone": "Deep Dive in Core Backend", "topics": ["Asynchronous patterns", "Advanced routing architectures"], "timeline": "Weeks 1-2"},
                {"milestone": "Database Performance Tuning", "topics": ["Compound indexing", "Query planner & profiling", "Caching (Redis)"], "timeline": "Weeks 3-4"},
                {"milestone": "System Architecture & Security", "topics": ["Distributed session management", "API security headers & Rate limiting"], "timeline": "Weeks 5-6"},
                {"milestone": "Containerization & DevOps", "topics": ["Dockerizing services", "CI/CD integration pipelines"], "timeline": "Weeks 7-8"}
            ]
        elif "frontend" in role_lower:
            milestones = [
                {"milestone": "Advanced Framework Concepts", "topics": ["Custom hooks & performance optimization", "State management (Zustand/Redux)"], "timeline": "Weeks 1-2"},
                {"milestone": "Static & Server Rendering", "topics": ["Next.js routing patterns", "Server-Side Rendering vs Static Generation"], "timeline": "Weeks 3-4"},
                {"milestone": "Web Performance Optimization", "topics": ["Asset compression & lazy loading", "Core Web Vitals auditing"], "timeline": "Weeks 5-6"},
                {"milestone": "Testing & Deployment", "topics": ["Unit testing (Jest)", "Vercel/Netlify optimized pipeline"], "timeline": "Weeks 7-8"}
            ]
        elif "machine learning" in role_lower or "ml" in role_lower or "data science" in role_lower:
            milestones = [
                {"milestone": "Data Engineering & Processing", "topics": ["Pandas processing pipelines", "Feature engineering at scale"], "timeline": "Weeks 1-2"},
                {"milestone": "Advanced Model Architectures", "topics": ["Deep learning models", "Fine-tuning transformer pipelines"], "timeline": "Weeks 3-4"},
                {"milestone": "Model Evaluation & Tuning", "topics": ["Cross-validation strategies", "Hyperparameter optimization"], "timeline": "Weeks 5-6"},
                {"milestone": "MLOps & API Deployment", "topics": ["Flask/FastAPI wrapper APIs", "Dockerized model serving"], "timeline": "Weeks 7-8"}
            ]
        else:
            milestones = [
                {"milestone": "System Integration & Performance", "topics": ["State management optimizations", "Dynamic asset bundling"], "timeline": "Weeks 1-2"},
                {"milestone": "Database Scaling", "topics": ["Index optimization", "Distributed data store caches"], "timeline": "Weeks 3-4"},
                {"milestone": "API Gateway Setup", "topics": ["Reverse proxy setups", "Centralized security headers"], "timeline": "Weeks 5-6"},
                {"milestone": "Cloud Infrastructure", "topics": ["Docker packaging", "AWS deployment workflows"], "timeline": "Weeks 7-8"}
            ]
            
        reply = json.dumps({"role": role, "roadmap": milestones})
        return jsonify({"reply": reply}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/ml/llm/hiring-intent", methods=["POST"])
def api_llm_hiring_intent():
    try:
        data = request.get_json() or {}
        system_prompt = data.get("system_prompt", "")
        
        dwell, audits, ats, chats = extract_intent_metrics(system_prompt)
        
        prob = 50.0
        try:
            if os.path.exists(scaler_path) and os.path.exists(params_path):
                scaler = joblib.load(scaler_path)
                params = joblib.load(params_path)
                W = params['coef']
                b = params['intercept']
                X = np.array([[dwell, audits, ats, chats]])
                X_scaled = scaler.transform(X)[0]
                logit = np.dot(W, X_scaled) + b
                prob = round(float(1.0 / (1.0 + np.exp(-logit))) * 100.0, 2)
            else:
                prob = min(99.0, 10.0 + (dwell * 0.5) + (audits * 15.0) + (ats * 20.0) + (chats * 10.0))
        except Exception:
            prob = min(99.0, 10.0 + (dwell * 0.5) + (audits * 15.0) + (ats * 20.0) + (chats * 10.0))
            
        if prob >= 85:
            warmth = "High Match (Ready to Hire)"
            summary = "Recruiter shows exceptional interest. Multiple codebase audits and ATS alignment scans indicate active evaluation."
            signals = ["Frequent Code Audits", "High Dwell Time", "ATS Matching Run"]
        elif prob >= 60:
            warmth = "Moderate (Interested)"
            summary = "Candidate profile is under active consideration. Recruiter conducted ATS scans and general profile evaluation."
            signals = ["Profile Views", "ATS Checks"]
        else:
            warmth = "Low (Passive)"
            summary = "Initial profile preview. Minimal recruiter tracking telemetry captured so far."
            signals = ["Profile View"]
            
        reply = json.dumps({
            "hiringProbability": prob,
            "recruiterWarmth": warmth,
            "keyInterestSignals": signals,
            "engagementSummary": summary
        })
        return jsonify({"reply": reply}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/ml/llm/architectural-review", methods=["POST"])
def api_llm_architectural_review():
    try:
        data = request.get_json() or {}
        system_prompt = data.get("system_prompt", "")
        
        cc, mi, grade, warnings = extract_code_metrics(system_prompt)
        
        if grade in ["A", "B"] and cc <= 5:
            review = f"The codebase demonstrates a highly clean and modular architecture (Grade {grade}) with low cyclomatic complexity of {cc}. The execution pathways are simple, readable, and conform to clean code standards."
        elif grade == "C" or cc <= 10:
            review = f"The system design shows standard maintainability (Grade {grade}) with a moderate complexity score of {cc}. Some functions could benefit from structural refactoring to reduce nested branching."
        else:
            review = f"The architecture presents significant technical debt (Grade {grade}) and high branching complexity of {cc}. Refactoring is recommended to segregate helper methods and mitigate security vulnerabilities."
            
        if warnings:
            review += f" Security warning alert: {warnings[0]} is flagged in static analysis."
            
        return jsonify({"reply": review}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/ml/llm/ats-gaps", methods=["POST"])
def api_llm_ats_gaps():
    try:
        data = request.get_json() or {}
        system_prompt = data.get("system_prompt", "")
        
        reply = json.dumps({
            "reasoning": "The candidate has aligned skills matching the technology expectations of the job profile.",
            "strengths": ["Structured System Implementations", "Clean Code Design"],
            "missingTechOrGaps": ["Infrastructure Scale Operations"]
        })
        return jsonify({"reply": reply}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", os.environ.get("AI_ENGINE_PORT", 8000)))
    print(f"Starting Python AI/ML Engine on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)

