"""
Utility functions for location-based features
"""
import math


def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the distance between two points on Earth using the Haversine formula.
    
    Args:
        lat1, lon1: Latitude and longitude of first point
        lat2, lon2: Latitude and longitude of second point
    
    Returns:
        Distance in kilometers
    """
    # Radius of Earth in kilometers
    R = 6371.0
    
    # Convert latitude and longitude from degrees to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    # Differences in coordinates
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    # Haversine formula
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    # Distance in kilometers
    distance = R * c
    
    return distance


def get_nearby_donors(user_lat, user_lon, radius_km=50):
    """
    Get donors within a specified radius (in kilometers).
    
    This is a helper function that you can use in your views.
    You would call it like:
    
        from core.models import Donor
        from core.location_utils import get_nearby_donors
        
        nearby_donors = get_nearby_donors(latitude, longitude, radius_km=25)
    
    Args:
        user_lat: User's latitude
        user_lon: User's longitude
        radius_km: Search radius in kilometers (default: 50)
    
    Returns:
        Queryset of Donor objects within the radius
    """
    from .models import Donor
    
    # Get all donors with location data
    donors = Donor.objects.filter(
        user__latitude__isnull=False,
        user__longitude__isnull=False
    ).select_related('user')
    
    nearby_donors = []
    for donor in donors:
        distance = calculate_distance(
            user_lat, user_lon,
            donor.user.latitude, donor.user.longitude
        )
        if distance <= radius_km:
            donor.distance = distance  # Add distance as an attribute
            nearby_donors.append(donor)
    
    # Sort by distance
    nearby_donors.sort(key=lambda x: x.distance)
    
    return nearby_donors


def get_nearby_blood_requests(lat, lon, radius_km=50):
    """
    Get blood requests within a specified radius (in kilometers).
    
    Args:
        lat: Latitude
        lon: Longitude
        radius_km: Search radius in kilometers (default: 50)
    
    Returns:
        List of BloodRequest objects with distance attribute
    """
    from .models import BloodRequest
    
    # Get requests from users with location data
    requests = BloodRequest.objects.filter(
        user__latitude__isnull=False,
        user__longitude__isnull=False
    ).select_related('user')
    
    nearby_requests = []
    for request in requests:
        distance = calculate_distance(
            lat, lon,
            request.user.latitude, request.user.longitude
        )
        if distance <= radius_km:
            request.distance = distance
            nearby_requests.append(request)
    
    # Sort by distance and then by urgency
    urgency_order = {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3}
    nearby_requests.sort(key=lambda x: (urgency_order.get(x.urgency, 99), x.distance))
    
    return nearby_requests

