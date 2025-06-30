import httpx
import os
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

from app.models import AdvocateSearchRequest, AdvocateSearchResponse

logger = logging.getLogger(__name__)

class ExpressClient:
    """Client for communicating with Express.js backend"""
    
    def __init__(self):
        self.base_url = os.getenv("EXPRESS_BACKEND_URL", "http://localhost:3000")
        self.api_prefix = os.getenv("EXPRESS_API_PREFIX", "/api")
        self.client: Optional[httpx.AsyncClient] = None
        self.timeout = 30.0
        
    async def initialize(self):
        """Initialize the HTTP client"""
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout,
            headers={"Content-Type": "application/json"}
        )
        logger.info(f"Express client initialized for {self.base_url}")
        
    async def close(self):
        """Close the HTTP client"""
        if self.client:
            await self.client.aclose()
            logger.info("Express client closed")
    
    async def search_advocates(self, search_request: AdvocateSearchRequest) -> Dict[str, Any]:
        """Search for advocates using Express backend"""
        
        if not self.client:
            logger.error("Express client not initialized")
            return {"success": False, "error": "Client not initialized"}
        
        try:
            # Prepare search payload
            search_payload = {
                "specialization": search_request.specialization.value if search_request.specialization else None,
                "availability_status": search_request.availability_required,
                "language_preferences": search_request.language_preferences,
                "sort_by": "rating",
                "sort_order": "desc"
            }
            
            # Add location filters
            if search_request.location:
                if search_request.location.city:
                    search_payload["location_city"] = search_request.location.city
                if search_request.location.state:
                    search_payload["jurisdiction_states"] = [search_request.location.state]
            
            # Add budget filter
            if search_request.budget_range:
                search_payload["max_fee"] = search_request.budget_range.get("max", 100000)
                search_payload["fee_type"] = "Consultation"
            
            # Make API call
            response = await self.client.post(
                f"{self.api_prefix}/search/advocate",
                json=search_payload
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Transform Express response to our format
                transformed_advocates = []
                for advocate in data.get("advocates", []):
                    transformed_advocate = self._transform_advocate_data(advocate)
                    transformed_advocates.append(transformed_advocate)
                
                return {
                    "success": True,
                    "total_matches": len(transformed_advocates),
                    "advocates": transformed_advocates,
                    "search_metadata": {
                        "query_time_ms": 200,
                        "filters_applied": len([k for k, v in search_payload.items() if v is not None]),
                        "backend_response_time": response.elapsed.total_seconds() * 1000
                    }
                }
            else:
                logger.error(f"Express API error: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "error": f"Backend error: {response.status_code}"
                }
                
        except httpx.TimeoutException:
            logger.error("Timeout while calling Express backend")
            return {"success": False, "error": "Request timeout"}
            
        except Exception as e:
            logger.error(f"Error calling Express backend: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_advocate_details(self, advocate_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific advocate"""
        
        if not self.client:
            return {"success": False, "error": "Client not initialized"}
        
        try:
            response = await self.client.get(f"{self.api_prefix}/advocate/{advocate_id}")
            
            if response.status_code == 200:
                data = response.json()
                return {"success": True, "advocate": data}
            else:
                return {"success": False, "error": f"Advocate not found: {response.status_code}"}
                
        except Exception as e:
            logger.error(f"Error getting advocate details: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_advocate_availability(self, advocate_id: str, date_range: Dict[str, str] = None) -> Dict[str, Any]:
        """Get advocate availability for scheduling"""
        
        if not self.client:
            return {"success": False, "error": "Client not initialized"}
        
        try:
            params = {}
            if date_range:
                params.update(date_range)
            
            response = await self.client.get(
                f"{self.api_prefix}/advocate/{advocate_id}/availability",
                params=params
            )
            
            if response.status_code == 200:
                data = response.json()
                return {"success": True, "availability": data}
            else:
                return {"success": False, "error": "Availability not found"}
                
        except Exception as e:
            logger.error(f"Error getting advocate availability: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def book_appointment(self, booking_data: Dict[str, Any]) -> Dict[str, Any]:
        """Book an appointment with an advocate"""
        
        if not self.client:
            return {"success": False, "error": "Client not initialized"}
        
        try:
            response = await self.client.post(
                f"{self.api_prefix}/appointments/book",
                json=booking_data
            )
            
            if response.status_code == 201:
                data = response.json()
                return {"success": True, "appointment": data}
            else:
                return {"success": False, "error": f"Booking failed: {response.status_code}"}
                
        except Exception as e:
            logger.error(f"Error booking appointment: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_user_appointments(self, user_id: str) -> Dict[str, Any]:
        """Get user's appointments"""
        
        if not self.client:
            return {"success": False, "error": "Client not initialized"}
        
        try:
            response = await self.client.get(f"{self.api_prefix}/appointments/user/{user_id}")
            
            if response.status_code == 200:
                data = response.json()
                return {"success": True, "appointments": data}
            else:
                return {"success": False, "error": "Appointments not found"}
                
        except Exception as e:
            logger.error(f"Error getting user appointments: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def _transform_advocate_data(self, express_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform Express backend advocate data to our format"""
        
        # Extract basic info
        basic_info = {
            "advocate_id": express_data.get("advocate_id", ""),
            "name": express_data.get("user", {}).get("name", ""),
            "image": express_data.get("user", {}).get("image"),
            "registration_number": express_data.get("registration_number", ""),
            "experience_years": express_data.get("experience_years", ""),
            "location_city": express_data.get("location_city", ""),
            "jurisdiction_states": express_data.get("jurisdiction_states", []),
            "language_preferences": express_data.get("language_preferences", [])
        }
        
        # Extract specializations
        specializations = []
        for spec in express_data.get("specializations", []):
            specializations.append({
                "specialization": spec.get("specialization", ""),
                "experience_level": "Expert",  # Default, could be enhanced
                "case_count": 50,  # Mock data
                "success_rate": 85.0  # Mock data
            })
        
        # Calculate ratings
        ratings_data = express_data.get("ratings", [])
        if ratings_data:
            total_stars = sum(rating.get("stars", 0) for rating in ratings_data)
            average_rating = total_stars / len(ratings_data)
            
            # Calculate rating distribution
            rating_distribution = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
            for rating in ratings_data:
                stars = str(rating.get("stars", 5))
                if stars in rating_distribution:
                    rating_distribution[stars] += 1
        else:
            average_rating = 4.5  # Default rating
            rating_distribution = {"5": 10, "4": 3, "3": 1, "2": 0, "1": 0}
        
        ratings_summary = {
            "average_rating": round(average_rating, 1),
            "total_reviews": len(ratings_data),
            "recent_rating": average_rating,
            "rating_distribution": rating_distribution
        }
        
        # Mock availability data
        availability = {
            "immediate_consultation": express_data.get("availability_status", True),
            "next_available_slot": "2024-06-22T10:00:00Z",  # Mock data
            "working_hours": express_data.get("working_hours", [10, 17]),
            "working_days": express_data.get("working_days", ["MON", "TUE", "WED", "THU", "FRI"]),
            "response_time_avg": "2 hours"
        }
        
        # Extract fee structure
        fee_structure_data = express_data.get("fee_structure", {})
        fee_structure = {
            "consultation": fee_structure_data.get("consultation", 2000),
            "case_handling": fee_structure_data.get("case_handling", 50000),
            "court_appearance": fee_structure_data.get("court_appearance", 5000),
            "document_review": fee_structure_data.get("document_review", 1500)
        }
        
        # Calculate AI match score (mock calculation)
        ai_match_score = min(95.0, (average_rating / 5) * 100)
        
        match_reasons = [
            f"High rating: {average_rating}/5",
            "Available for immediate consultation",
            "Good client reviews",
            "Relevant specialization"
        ]
        
        return {
            "basic_info": basic_info,
            "specializations": specializations,
            "ratings_summary": ratings_summary,
            "availability": availability,
            "fee_structure": fee_structure,
            "ai_match_score": ai_match_score,
            "match_reasons": match_reasons
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if Express backend is healthy"""
        
        if not self.client:
            return {"success": False, "error": "Client not initialized"}
        
        try:
            response = await self.client.get("/health")
            
            if response.status_code == 200:
                return {"success": True, "status": "healthy"}
            else:
                return {"success": False, "status": "unhealthy"}
                
        except Exception as e:
            logger.error(f"Express backend health check failed: {str(e)}")
            return {"success": False, "error": str(e)}
