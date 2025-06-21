from datetime import datetime
from typing import Dict, Any, Optional, List
import uuid
import json
import logging

logger = logging.getLogger(__name__)

def get_current_timestamp() -> str:
    """Get current timestamp in ISO format"""
    return datetime.now().isoformat()

def generate_session_id() -> str:
    """Generate unique session ID"""
    return str(uuid.uuid4())

def generate_message_id() -> str:
    """Generate unique message ID"""
    return str(uuid.uuid4())

def safe_json_loads(json_str: str, default: Any = None) -> Any:
    """Safely parse JSON string"""
    try:
        return json.loads(json_str)
    except (json.JSONDecodeError, TypeError) as e:
        logger.error(f"Error parsing JSON: {str(e)}")
        return default

def safe_json_dumps(obj: Any, default: str = "{}") -> str:
    """Safely convert object to JSON string"""
    try:
        return json.dumps(obj, ensure_ascii=False, default=str)
    except (TypeError, ValueError) as e:
        logger.error(f"Error converting to JSON: {str(e)}")
        return default

def extract_keywords(text: str) -> List[str]:
    """Extract keywords from text for search purposes"""
    # Simple keyword extraction - can be enhanced with NLP
    import re
    
    # Remove common stop words
    stop_words = {
        'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 
        'in', 'with', 'to', 'for', 'of', 'as', 'by', 'from', 'up', 'into',
        'over', 'after', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours',
        'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves'
    }
    
    # Extract words (alphanumeric, including Hindi/other languages)
    words = re.findall(r'\b\w+\b', text.lower())
    
    # Filter out stop words and short words
    keywords = [word for word in words if word not in stop_words and len(word) > 2]
    
    return list(set(keywords))  # Remove duplicates

def classify_legal_domain(text: str) -> str:
    """Classify text into legal domains"""
    text_lower = text.lower()
    
    # Define keyword mappings for legal domains
    domain_keywords = {
        'criminal': ['crime', 'criminal', 'police', 'fir', 'arrest', 'bail', 'murder', 'theft', 'assault'],
        'civil': ['civil', 'contract', 'breach', 'damages', 'tort', 'negligence', 'liability'],
        'property': ['property', 'land', 'real estate', 'sale', 'purchase', 'title', 'ownership', 'boundary'],
        'family': ['family', 'marriage', 'divorce', 'custody', 'maintenance', 'adoption', 'inheritance'],
        'corporate': ['company', 'corporate', 'business', 'shares', 'director', 'board', 'compliance'],
        'tax': ['tax', 'income tax', 'gst', 'taxation', 'return', 'assessment', 'revenue'],
        'consumer': ['consumer', 'product', 'service', 'complaint', 'deficiency', 'compensation'],
        'labor': ['labor', 'employment', 'worker', 'salary', 'termination', 'pf', 'esi'],
        'intellectual': ['patent', 'trademark', 'copyright', 'ip', 'intellectual property', 'brand'],
        'constitutional': ['constitutional', 'fundamental rights', 'article', 'constitution', 'writ']
    }
    
    # Score each domain
    domain_scores = {}
    for domain, keywords in domain_keywords.items():
        score = sum(1 for keyword in keywords if keyword in text_lower)
        if score > 0:
            domain_scores[domain] = score
    
    # Return domain with highest score, or 'general' if no matches
    if domain_scores:
        return max(domain_scores.items(), key=lambda x: x[1])[0]
    else:
        return 'general'

def detect_urgency_level(text: str) -> str:
    """Detect urgency level from text"""
    text_lower = text.lower()
    
    urgent_keywords = ['urgent', 'emergency', 'immediate', 'asap', 'quickly', 'rush', 'critical']
    medium_keywords = ['soon', 'within', 'week', 'month', 'need help', 'important']
    
    if any(keyword in text_lower for keyword in urgent_keywords):
        return 'HIGH'
    elif any(keyword in text_lower for keyword in medium_keywords):
        return 'MEDIUM'
    else:
        return 'LOW'

def extract_location(text: str) -> Optional[Dict[str, str]]:
    """Extract location information from text"""
    text_lower = text.lower()
    
    # Common Indian cities and states
    cities = {
        'mumbai': {'city': 'Mumbai', 'state': 'Maharashtra'},
        'delhi': {'city': 'Delhi', 'state': 'Delhi'},
        'bangalore': {'city': 'Bangalore', 'state': 'Karnataka'},
        'bengaluru': {'city': 'Bangalore', 'state': 'Karnataka'},
        'chennai': {'city': 'Chennai', 'state': 'Tamil Nadu'},
        'kolkata': {'city': 'Kolkata', 'state': 'West Bengal'},
        'hyderabad': {'city': 'Hyderabad', 'state': 'Telangana'},
        'pune': {'city': 'Pune', 'state': 'Maharashtra'},
        'ahmedabad': {'city': 'Ahmedabad', 'state': 'Gujarat'},
        'jaipur': {'city': 'Jaipur', 'state': 'Rajasthan'},
        'lucknow': {'city': 'Lucknow', 'state': 'Uttar Pradesh'},
        'kanpur': {'city': 'Kanpur', 'state': 'Uttar Pradesh'},
        'nagpur': {'city': 'Nagpur', 'state': 'Maharashtra'},
        'indore': {'city': 'Indore', 'state': 'Madhya Pradesh'},
        'bhopal': {'city': 'Bhopal', 'state': 'Madhya Pradesh'}
    }
    
    for city_key, location_info in cities.items():
        if city_key in text_lower:
            return location_info
    
    return None

def format_currency(amount: float, currency: str = "INR") -> str:
    """Format currency amount"""
    if currency == "INR":
        if amount >= 10000000:  # 1 crore
            return f"₹{amount/10000000:.1f} Cr"
        elif amount >= 100000:  # 1 lakh
            return f"₹{amount/100000:.1f} L"
        elif amount >= 1000:  # 1 thousand
            return f"₹{amount/1000:.1f} K"
        else:
            return f"₹{amount:,.0f}"
    else:
        return f"{currency} {amount:,.2f}"

def calculate_similarity_score(text1: str, text2: str) -> float:
    """Calculate similarity between two texts (simple implementation)"""
    # Simple Jaccard similarity
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    
    if len(union) == 0:
        return 0.0
    
    return len(intersection) / len(union)

def sanitize_input(text: str, max_length: int = 1000) -> str:
    """Sanitize user input"""
    if not text:
        return ""
    
    # Remove potentially dangerous characters
    import re
    sanitized = re.sub(r'[<>"\']', '', text)
    
    # Limit length
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length] + "..."
    
    return sanitized.strip()

def validate_email(email: str) -> bool:
    """Validate email format"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone: str) -> bool:
    """Validate Indian phone number"""
    import re
    # Indian phone number patterns
    patterns = [
        r'^\+91[6-9]\d{9}$',  # +91 followed by 10 digits
        r'^[6-9]\d{9}$',      # 10 digits starting with 6-9
        r'^0[6-9]\d{9}$'      # 11 digits starting with 0
    ]
    
    return any(re.match(pattern, phone) for pattern in patterns)

def create_error_response(message: str, error_code: str = "GENERIC_ERROR") -> Dict[str, Any]:
    """Create standardized error response"""
    return {
        "success": False,
        "error": {
            "code": error_code,
            "message": message,
            "timestamp": get_current_timestamp()
        }
    }

def create_success_response(data: Any = None, message: str = "Success") -> Dict[str, Any]:
    """Create standardized success response"""
    return {
        "success": True,
        "message": message,
        "data": data,
        "timestamp": get_current_timestamp()
    }
