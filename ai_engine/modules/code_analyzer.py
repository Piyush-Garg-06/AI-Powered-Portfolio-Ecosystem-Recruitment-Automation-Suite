import re
from radon.complexity import cc_visit
from radon.metrics import mi_visit

def compute_complexity(raw_code: str) -> float:
    """Calculates average Cyclomatic Complexity using cc_visit."""
    if not raw_code or not raw_code.strip():
        return 1.0
    try:
        blocks = cc_visit(raw_code)
        if blocks:
            total_cc = sum(block.complexity for block in blocks)
            return float(total_cc) / len(blocks)
        return 1.0
    except Exception:
        return 1.0

def compute_maintainability(raw_code: str) -> float:
    """Calculates Maintainability Index capped between 0 and 100."""
    if not raw_code or not raw_code.strip():
        return 100.0
    try:
        mi = float(mi_visit(raw_code, multi=True))
        return max(0.0, min(100.0, mi))
    except Exception:
        return 75.0

def security_scan(raw_code: str) -> list[str]:
    """Uses Regex to flag hardcoded secrets and unsafe eval() executions."""
    warnings = []
    if not raw_code or not raw_code.strip():
        return warnings

    # Check for hardcoded credentials/secrets
    if re.search(r'(jwt_secret|jwtsecret|jwt_key|private_key|api_key|apikey|db_password)\s*=\s*[\'"][^\'"]{8,}[\'"]', raw_code, re.IGNORECASE):
        warnings.append("Potential hardcoded secret or API/private key detected.")
    
    # Check for unsafe eval calls
    if re.search(r'\beval\s*\([^\)]+\)', raw_code):
        warnings.append("Dangerous use of plain eval() function detected.")

    return warnings

def audit_code(raw_code: str) -> dict:
    """Combines metrics and security scan to assign a risk grade and return metrics."""
    avg_cc = compute_complexity(raw_code)
    mi = compute_maintainability(raw_code)
    warnings = security_scan(raw_code)

    # Determine risk grade based on maintainability index (MI)
    if mi >= 80:
        grade = "A"
    elif mi >= 65:
        grade = "B"
    elif mi >= 50:
        grade = "C"
    else:
        grade = "F"

    # Downgrade based on security issues or high complexity
    if warnings:
        if grade in ["A", "B"]:
            grade = "C"
        else:
            grade = "F"

    if avg_cc > 15:
        if grade == "A":
            grade = "B"
        elif grade == "B":
            grade = "C"
        elif grade == "C":
            grade = "F"

    return {
        "cyclomatic_complexity": round(avg_cc, 2),
        "maintainability_index": round(mi, 2),
        "risk_grade": grade,
        "security_warnings": warnings
    }
