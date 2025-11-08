"""
Analytics API endpoints for LifeLink dashboard
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Avg, Sum
from django.utils import timezone
from datetime import datetime, timedelta
from collections import defaultdict
import json

from core.models import (
    Donor, BloodRequest, DonationHistory, 
    DonorRecipientMatch, Notification, User
)

class AnalyticsView(APIView):
    """Comprehensive analytics endpoint"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get analytics data for dashboard"""
        time_range = request.GET.get('time_range', '30d')
        
        # Calculate date range
        end_date = timezone.now().date()
        if time_range == '7d':
            start_date = end_date - timedelta(days=7)
        elif time_range == '30d':
            start_date = end_date - timedelta(days=30)
        elif time_range == '90d':
            start_date = end_date - timedelta(days=90)
        elif time_range == '1y':
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=30)
        
        analytics_data = {
            'overview': self.get_overview_stats(start_date, end_date),
            'trends': self.get_trends_data(start_date, end_date),
            'bloodGroupDistribution': self.get_blood_group_distribution(),
            'locationStats': self.get_location_stats(start_date, end_date),
            'successRates': self.get_success_rates_by_blood_group(),
            'donorActivity': self.get_donor_activity_timeline(start_date, end_date),
            'urgentRequests': self.get_urgent_requests()
        }
        
        return Response(analytics_data)
    
    def get_overview_stats(self, start_date, end_date):
        """Get overview statistics"""
        total_matches = DonorRecipientMatch.objects.filter(
            created_at__date__range=[start_date, end_date]
        ).count()
        
        total_donations = DonationHistory.objects.filter(
            donation_date__date__range=[start_date, end_date],
            is_successful=True
        ).count()
        
        active_donors = Donor.objects.filter(
            availability=True,
            updated_at__date__range=[start_date, end_date]
        ).count()
        
        urgent_requests = BloodRequest.objects.filter(
            urgency__in=['CRITICAL', 'HIGH'],
            created_at__date__range=[start_date, end_date]
        ).count()
        
        # Calculate success rate
        successful_matches = DonorRecipientMatch.objects.filter(
            status='COMPLETED',
            created_at__date__range=[start_date, end_date]
        ).count()
        
        success_rate = (successful_matches / total_matches * 100) if total_matches > 0 else 0
        
        return {
            'total_matches': total_matches,
            'total_donations': total_donations,
            'active_donors': active_donors,
            'urgent_requests': urgent_requests,
            'success_rate': round(success_rate, 1)
        }
    
    def get_trends_data(self, start_date, end_date):
        """Get trends data for charts"""
        trends = []
        current_date = start_date
        
        while current_date <= end_date:
            next_date = current_date + timedelta(days=1)
            
            matches_count = DonorRecipientMatch.objects.filter(
                created_at__date=current_date
            ).count()
            
            donations_count = DonationHistory.objects.filter(
                donation_date__date=current_date,
                is_successful=True
            ).count()
            
            trends.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'matches': matches_count,
                'donations': donations_count
            })
            
            current_date = next_date
        
        return trends
    
    def get_blood_group_distribution(self):
        """Get blood group distribution"""
        distribution = []
        blood_groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        
        for blood_group in blood_groups:
            count = Donor.objects.filter(blood_group=blood_group).count()
            distribution.append({
                'name': blood_group,
                'value': count
            })
        
        return distribution
    
    def get_location_stats(self, start_date, end_date):
        """Get location statistics"""
        # Get top cities by activity
        city_stats = defaultdict(lambda: {'matches': 0, 'donations': 0})
        
        # Count matches by city
        matches = DonorRecipientMatch.objects.filter(
            created_at__date__range=[start_date, end_date]
        ).select_related('blood_request')
        
        for match in matches:
            city = match.blood_request.city
            city_stats[city]['matches'] += 1
        
        # Count donations by city
        donations = DonationHistory.objects.filter(
            donation_date__date__range=[start_date, end_date],
            is_successful=True
        ).select_related('recipient_request')
        
        for donation in donations:
            city = donation.recipient_request.city
            city_stats[city]['donations'] += 1
        
        # Convert to list and sort by total activity
        location_stats = []
        for city, stats in city_stats.items():
            if city:  # Skip empty cities
                location_stats.append({
                    'city': city,
                    'matches': stats['matches'],
                    'donations': stats['donations']
                })
        
        # Sort by total activity and return top 10
        location_stats.sort(key=lambda x: x['matches'] + x['donations'], reverse=True)
        return location_stats[:10]
    
    def get_success_rates_by_blood_group(self):
        """Get success rates by blood group"""
        success_rates = []
        blood_groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        
        for blood_group in blood_groups:
            total_matches = DonorRecipientMatch.objects.filter(
                blood_request__blood_group=blood_group
            ).count()
            
            successful_matches = DonorRecipientMatch.objects.filter(
                blood_request__blood_group=blood_group,
                status='COMPLETED'
            ).count()
            
            success_rate = (successful_matches / total_matches * 100) if total_matches > 0 else 0
            
            success_rates.append({
                'blood_group': blood_group,
                'success_rate': round(success_rate, 1)
            })
        
        return success_rates
    
    def get_donor_activity_timeline(self, start_date, end_date):
        """Get donor activity timeline"""
        activity = []
        current_date = start_date
        
        while current_date <= end_date:
            next_date = current_date + timedelta(days=1)
            
            new_donors = Donor.objects.filter(
                created_at__date=current_date
            ).count()
            
            active_donors = Donor.objects.filter(
                availability=True,
                updated_at__date=current_date
            ).count()
            
            donations = DonationHistory.objects.filter(
                donation_date__date=current_date,
                is_successful=True
            ).count()
            
            activity.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'new_donors': new_donors,
                'active_donors': active_donors,
                'donations': donations
            })
            
            current_date = next_date
        
        return activity
    
    def get_urgent_requests(self):
        """Get recent urgent requests"""
        urgent_requests = BloodRequest.objects.filter(
            urgency__in=['CRITICAL', 'HIGH']
        ).order_by('-created_at')[:10]
        
        requests_data = []
        for request in urgent_requests:
            requests_data.append({
                'patient_name': request.patient_name,
                'blood_group': request.blood_group,
                'city': request.city,
                'state': request.state,
                'urgency': request.urgency,
                'status': request.status,
                'created_at': request.created_at.isoformat()
            })
        
        return requests_data

class PredictiveAnalyticsView(APIView):
    """Predictive analytics endpoint"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get predictive analytics data"""
        # Blood demand prediction
        demand_prediction = self.predict_blood_demand()
        
        # Donor availability prediction
        availability_prediction = self.predict_donor_availability()
        
        # Success rate prediction
        success_prediction = self.predict_success_rates()
        
        return Response({
            'demand_prediction': demand_prediction,
            'availability_prediction': availability_prediction,
            'success_prediction': success_prediction
        })
    
    def predict_blood_demand(self):
        """Predict blood demand for next 30 days"""
        # Simple prediction based on historical data
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=30)
        
        # Get historical request data
        historical_requests = BloodRequest.objects.filter(
            created_at__date__range=[start_date, end_date]
        ).values('blood_group').annotate(count=Count('id'))
        
        # Calculate average daily demand by blood group
        demand_prediction = {}
        for item in historical_requests:
            blood_group = item['blood_group']
            avg_daily = item['count'] / 30
            demand_prediction[blood_group] = {
                'current_demand': avg_daily,
                'predicted_demand': avg_daily * 1.1,  # 10% increase prediction
                'confidence': 0.75
            }
        
        return demand_prediction
    
    def predict_donor_availability(self):
        """Predict donor availability"""
        # Get donors who will be eligible to donate soon
        eligible_soon = Donor.objects.filter(
            last_donation_date__lte=timezone.now().date() - timedelta(days=80)
        ).count()
        
        # Get donors who are currently available
        currently_available = Donor.objects.filter(availability=True).count()
        
        return {
            'currently_available': currently_available,
            'eligible_soon': eligible_soon,
            'predicted_availability': currently_available + eligible_soon
        }
    
    def predict_success_rates(self):
        """Predict success rates for different scenarios"""
        # Calculate historical success rates
        total_matches = DonorRecipientMatch.objects.count()
        successful_matches = DonorRecipientMatch.objects.filter(status='COMPLETED').count()
        
        current_success_rate = (successful_matches / total_matches * 100) if total_matches > 0 else 0
        
        return {
            'current_success_rate': round(current_success_rate, 1),
            'predicted_success_rate': round(current_success_rate * 1.05, 1),  # 5% improvement
            'confidence': 0.8
        }
