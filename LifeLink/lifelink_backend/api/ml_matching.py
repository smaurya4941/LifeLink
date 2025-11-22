"""
Advanced ML Matching Algorithm for LifeLink
Includes health risk assessment, predictive analytics, and enhanced scoring
"""

import numpy as np
import pandas as pd
from datetime import date, datetime, timedelta
from typing import Dict, List, Tuple, Optional
from django.db.models import Q
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_squared_error
import joblib
import os
from django.conf import settings
from django.utils import timezone


class AdvancedMatchingEngine:
    """
    Advanced ML-powered matching engine with health risk assessment
    """
    
    def __init__(self):
        self.blood_compatibility_matrix = {
            'A+': ['A+', 'A-', 'O+', 'O-'],
            'A-': ['A-', 'O-'],
            'B+': ['B+', 'B-', 'O+', 'O-'],
            'B-': ['B-', 'O-'],
            'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            'AB-': ['A-', 'B-', 'AB-', 'O-'],
            'O+': ['O+', 'O-'],
            'O-': ['O-']
        }
        
        self.health_risk_factors = {
            'diabetes': 0.3,
            'hypertension': 0.2,
            'heart_disease': 0.4,
            'anemia': 0.1,
            'hepatitis': 0.5,
            'hiv': 0.8,
            'cancer': 0.6,
            'pregnancy': 0.2,
            'recent_surgery': 0.3,
            'medication': 0.1
        }
        
        self.urgency_weights = {
            'CRITICAL': 1.0,
            'HIGH': 0.8,
            'MEDIUM': 0.6,
            'LOW': 0.4
        }
        
        # Initialize ML models
        self.health_risk_model = None
        self.success_prediction_model = None
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        
    def calculate_health_risk_score(self, donor_medical_conditions: str, 
                                  recipient_medical_conditions: str) -> float:
        """
        Calculate health risk score based on medical conditions
        """
        risk_score = 0.0
        
        if not donor_medical_conditions and not recipient_medical_conditions:
            return 0.0
            
        donor_conditions = donor_medical_conditions.lower().split(',') if donor_medical_conditions else []
        recipient_conditions = recipient_medical_conditions.lower().split(',') if recipient_medical_conditions else []
        
        # Check for high-risk conditions in donor
        for condition in donor_conditions:
            condition = condition.strip()
            if condition in self.health_risk_factors:
                risk_score += self.health_risk_factors[condition]
        
        # Check for compatibility issues
        incompatible_conditions = [
            ('diabetes', 'diabetes'),
            ('hypertension', 'hypertension'),
            ('heart_disease', 'heart_disease')
        ]
        
        for donor_cond, recipient_cond in incompatible_conditions:
            if donor_cond in donor_conditions and recipient_cond in recipient_conditions:
                risk_score += 0.2
                
        return min(risk_score, 1.0)
    
    def calculate_location_score(self, donor_city: str, donor_state: str, donor_pincode: str,
                              recipient_city: str, recipient_state: str, recipient_pincode: str) -> float:
        """
        Enhanced location scoring with pincode-based distance calculation
        """
        location_score = 0.0
        
        # Exact city match
        if donor_city.lower() == recipient_city.lower():
            location_score += 0.4
            
            # Same pincode (very close)
            if donor_pincode == recipient_pincode:
                location_score += 0.3
            # Same area (first 3 digits of pincode)
            elif donor_pincode[:3] == recipient_pincode[:3]:
                location_score += 0.2
            # Same district (first 2 digits)
            elif donor_pincode[:2] == recipient_pincode[:2]:
                location_score += 0.1
        else:
            # Same state
            if donor_state.lower() == recipient_state.lower():
                location_score += 0.2
                
        return min(location_score, 0.7)
    
    def calculate_temporal_score(self, donor_last_donation: Optional[date], 
                               required_date: date, urgency: str) -> float:
        """
        Calculate temporal compatibility score
        """
        temporal_score = 0.0
        
        # Check if donor can donate (90-day rule)
        if donor_last_donation:
            days_since_donation = (date.today() - donor_last_donation).days
            if days_since_donation < 90:
                return 0.0  # Cannot donate
            elif days_since_donation >= 90:
                temporal_score += 0.2
        
        # Check urgency vs availability timing
        days_until_required = (required_date - date.today()).days
        
        if urgency == 'CRITICAL':
            if days_until_required <= 1:
                temporal_score += 0.3
            elif days_until_required <= 3:
                temporal_score += 0.2
        elif urgency == 'HIGH':
            if days_until_required <= 3:
                temporal_score += 0.2
            elif days_until_required <= 7:
                temporal_score += 0.1
        elif urgency == 'MEDIUM':
            if days_until_required <= 7:
                temporal_score += 0.1
        
        return min(temporal_score, 0.5)
    
    def calculate_donor_reliability_score(self, donor) -> float:
        """
        Calculate donor reliability based on history and verification
        """
        reliability_score = 0.0
        
        # Verification status
        if donor.is_verified:
            reliability_score += 0.3
        
        # Donation history (if available)
        donation_count = donor.donation_history.count()
        if donation_count > 0:
            reliability_score += min(donation_count * 0.05, 0.3)
        
        # Profile completeness
        profile_fields = [
            donor.weight, donor.height, donor.emergency_contact,
            donor.medical_conditions
        ]
        completed_fields = sum(1 for field in profile_fields if field)
        reliability_score += (completed_fields / len(profile_fields)) * 0.2
        
        # Recent activity
        if donor.updated_at:
            days_since_update = (timezone.now().date() - donor.updated_at.date()).days
            if days_since_update <= 30:
                reliability_score += 0.2
        
        return min(reliability_score, 1.0)
    
    def calculate_advanced_matching_score(self, donor, blood_request) -> Dict[str, float]:
        """
        Calculate comprehensive matching score with detailed breakdown
        """
        scores = {
            'blood_compatibility': 0.0,
            'location_proximity': 0.0,
            'temporal_compatibility': 0.0,
            'health_risk': 0.0,
            'donor_reliability': 0.0,
            'urgency_factor': 0.0,
            'overall_score': 0.0
        }
        
        # Blood compatibility (40% weight)
        compatible_groups = self.blood_compatibility_matrix.get(blood_request.blood_group, [])
        if donor.blood_group in compatible_groups:
            if donor.blood_group == blood_request.blood_group:
                scores['blood_compatibility'] = 0.4  # Exact match
            elif donor.blood_group in ['O-', 'O+']:
                scores['blood_compatibility'] = 0.35  # Universal donor
            else:
                scores['blood_compatibility'] = 0.3   # Compatible
        
        # Location proximity (25% weight)
        scores['location_proximity'] = self.calculate_location_score(
            donor.city, donor.state, donor.pincode,
            blood_request.city, blood_request.state, blood_request.pincode
        ) * 0.25
        
        # Temporal compatibility (15% weight)
        scores['temporal_compatibility'] = self.calculate_temporal_score(
            donor.last_donation_date, blood_request.required_date, blood_request.urgency
        ) * 0.15
        
        # Health risk assessment (10% weight) - Lower risk = higher score
        health_risk = self.calculate_health_risk_score(
            donor.medical_conditions, blood_request.description
        )
        scores['health_risk'] = (1.0 - health_risk) * 0.1
        
        # Donor reliability (5% weight)
        scores['donor_reliability'] = self.calculate_donor_reliability_score(donor) * 0.05
        
        # Urgency factor (5% weight)
        scores['urgency_factor'] = self.urgency_weights.get(blood_request.urgency, 0.6) * 0.05
        
        # Calculate overall score
        scores['overall_score'] = sum([
            scores['blood_compatibility'],
            scores['location_proximity'],
            scores['temporal_compatibility'],
            scores['health_risk'],
            scores['donor_reliability'],
            scores['urgency_factor']
        ])
        
        return scores
    
    def predict_match_success_probability(self, donor, blood_request) -> float:
        """
        Predict the probability of successful match completion using ML
        """
        # Feature engineering for ML model
        features = self.extract_features_for_prediction(donor, blood_request)
        
        # For now, return a heuristic-based prediction
        # In production, this would use a trained ML model
        base_probability = 0.7
        
        # Adjust based on various factors
        if donor.is_verified:
            base_probability += 0.1
        
        if blood_request.urgency == 'CRITICAL':
            base_probability += 0.1
        
        # Reduce probability for high health risk
        health_risk = self.calculate_health_risk_score(
            donor.medical_conditions, blood_request.description
        )
        base_probability -= health_risk * 0.2
        
        return max(0.0, min(1.0, base_probability))
    
    def extract_features_for_prediction(self, donor, blood_request) -> Dict:
        """
        Extract features for ML prediction model
        """
        return {
            'donor_age': self.calculate_age(donor.user.date_of_birth),
            'donor_weight': donor.weight or 0,
            'donor_height': donor.height or 0,
            'donor_verified': int(donor.is_verified),
            'donor_donation_count': donor.donation_history.count(),
            'request_urgency': self.urgency_weights.get(blood_request.urgency, 0.6),
            'location_match': int(donor.city.lower() == blood_request.city.lower()),
            'health_risk': self.calculate_health_risk_score(
                donor.medical_conditions, blood_request.description
            ),
            'days_since_last_donation': self.get_days_since_donation(donor.last_donation_date),
            'profile_completeness': self.calculate_profile_completeness(donor)
        }
    
    def calculate_age(self, birth_date) -> int:
        """Calculate age from birth date"""
        if not birth_date:
            return 0
        today = date.today()
        return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    
    def get_days_since_donation(self, last_donation_date) -> int:
        """Get days since last donation"""
        if not last_donation_date:
            return 999  # Large number for first-time donors
        return (date.today() - last_donation_date).days
    
    def calculate_profile_completeness(self, donor) -> float:
        """Calculate profile completeness percentage"""
        fields = [
            donor.weight, donor.height, donor.emergency_contact,
            donor.medical_conditions, donor.address, donor.city
        ]
        completed = sum(1 for field in fields if field)
        return completed / len(fields)
    
    def find_optimal_matches(self, blood_request, max_matches: int = 10) -> List[Dict]:
        """
        Find optimal matches for a blood request using advanced ML
        """
        from core.models import Donor
        
        # Get compatible donors
        compatible_groups = self.blood_compatibility_matrix.get(blood_request.blood_group, [])
        
        eligible_donors = Donor.objects.filter(
            blood_group__in=compatible_groups,
            availability=True
        ).filter(
            Q(last_donation_date__lte=date.today() - timedelta(days=90)) | 
            Q(last_donation_date__isnull=True)
        ).select_related('user').prefetch_related('donation_history')
        
        matches = []
        
        for donor in eligible_donors:
            # Calculate comprehensive matching score
            scores = self.calculate_advanced_matching_score(donor, blood_request)
            
            # Predict success probability
            success_probability = self.predict_match_success_probability(donor, blood_request)
            
            # Only include matches above threshold
            if scores['overall_score'] > 0.3:  # Minimum threshold
                match_data = {
                    'donor': donor,
                    'scores': scores,
                    'success_probability': success_probability,
                    'health_risk': self.calculate_health_risk_score(
                        donor.medical_conditions, blood_request.description
                    ),
                    'distance_km': self.calculate_distance_km(
                        donor.city, donor.state, blood_request.city, blood_request.state
                    )
                }
                matches.append(match_data)
        
        # Sort by overall score and success probability
        matches.sort(key=lambda x: (x['scores']['overall_score'], x['success_probability']), reverse=True)
        
        return matches[:max_matches]
    
    def calculate_distance_km(self, donor_city: str, donor_state: str,
                            recipient_city: str, recipient_state: str) -> float:
        """
        Calculate approximate distance between locations
        """
        # Simplified distance calculation based on city/state
        if donor_city.lower() == recipient_city.lower():
            return 0.0
        elif donor_state.lower() == recipient_state.lower():
            return 50.0  # Approximate intra-state distance
        else:
            return 200.0  # Approximate inter-state distance

# Global instance
matching_engine = AdvancedMatchingEngine()
