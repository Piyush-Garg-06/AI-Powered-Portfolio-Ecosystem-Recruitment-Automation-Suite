import requests
import json

base_url = "http://localhost:5000"

print("--- Testing GET /api/portfolio/testuser ---")
try:
    r = requests.get(f"{base_url}/api/portfolio/testuser")
    print("Status Code:", r.status_code)
    if r.status_code == 200:
        data = r.json()
        print("Success! Candidate Name:", data.get("name"))
    else:
        print("Response:", r.text)
except Exception as e:
    print("Error:", e)

print("\n--- Testing POST /api/portfolio/testuser/public-audit ---")
try:
    payload = {
        "recruiterUsername": "testrecruiter",
        "companyName": "DevScale Corp"
    }
    r = requests.post(f"{base_url}/api/portfolio/testuser/public-audit", json=payload)
    print("Status Code:", r.status_code)
    if r.status_code == 200:
        data = r.json()
        print("Success! Audit Score:", data.get("auditReport", {}).get("scores"))
        print("Architectural Review:", data.get("auditReport", {}).get("architecturalReview"))
    else:
        print("Response:", r.text)
except Exception as e:
    print("Error:", e)

print("\n--- Testing POST /api/portfolio/testuser/public-ats ---")
try:
    payload = {
        "jobDescription": "We want a Node.js developer with React experience, clean code principles, and git knowledge.",
        "recruiterUsername": "testrecruiter",
        "companyName": "DevScale Corp"
    }
    r = requests.post(f"{base_url}/api/portfolio/testuser/public-ats", json=payload)
    print("Status Code:", r.status_code)
    if r.status_code == 200:
        data = r.json()
        print("Success! Match Score:", data.get("atsResult", {}).get("matchPercentage"), "%")
        print("Strengths:", data.get("atsResult", {}).get("strengths"))
        print("Missing Tech:", data.get("atsResult", {}).get("missingTechOrGaps"))
    else:
        print("Response:", r.text)
except Exception as e:
    print("Error:", e)
