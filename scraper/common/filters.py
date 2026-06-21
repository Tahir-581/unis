"""CS program taxonomy and English-language filters."""

from __future__ import annotations

import re

CS_KEYWORDS = re.compile(
    r"\b("
    r"computer\s*science|informatics|informatik|informática|informatique|"
    r"computer\s*engineering|informatics?\s*engineering|software\s*engineering|"
    r"artificial\s*intelligence|machine\s*learning|deep\s*learning|"
    r"data\s*science|big\s*data|cyber\s*security|cybersecurity|"
    r"information\s*security|software\s*systems|computing|"
    r"intelligent\s*systems|robotics\s*and\s*ai|ai\s*and\s*robotics"
    r")\b",
    re.IGNORECASE,
)

EXCLUDE_KEYWORDS = re.compile(
    r"\b("
    r"phd|doctorate|bachelor|b\.?sc\.?|undergraduate|mba|"
    r"business\s*informatics|wirtschaftsinformatik|integrated\s*master|"
    r"mestrado\s*integrado|laurea\s*triennale"
    r")\b",
    re.IGNORECASE,
)

ENGLISH_KEYWORDS = re.compile(
    r"\b(english|englisch|inglés|anglais|inglese)\b",
    re.IGNORECASE,
)


def classify_cs_category(name: str) -> str:
    n = name.lower()
    if re.search(r"cyber|security", n):
        return "cybersecurity"
    if re.search(r"data\s*science|big\s*data", n):
        return "data_science"
    if re.search(r"artificial|machine\s*learning|\bai\b", n):
        return "ai"
    if re.search(r"software", n):
        return "software"
    if re.search(r"engineering|ingenier", n):
        return "cs_engineering"
    return "informatics"


def is_cs_master(name: str, description: str = "") -> bool:
    text = f"{name} {description}"
    if EXCLUDE_KEYWORDS.search(text):
        return False
    return bool(CS_KEYWORDS.search(text))


def is_english_program(name: str, language_field: str = "", description: str = "") -> bool:
    combined = f"{name} {language_field} {description}".lower()
    if "english" in combined or "englisch" in combined or "inglese" in combined:
        return True
    if ENGLISH_KEYWORDS.search(combined):
        return True
    # Programs listed in international/English portals are assumed English
    return False
