#!/usr/bin/env python
"""
Simple test script to verify LifeLink API endpoints
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_api():
    print("Testing LifeLink API Endpoints...")
    print("=" * 50)
    
    # Test 1: Health check (if available)
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"[OK] API Root: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] API Root: {e}")
    
    # Test 2: Register a test user
    test_user = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123",
        "password_confirm": "testpass123",
        "first_name": "Test",
        "last_name": "User",
        "is_donor": True,
        "is_recipient": True
    }
    
    try:
        response = requests.post(f"{BASE_URL}/register/", json=test_user)
        if response.status_code in [200, 201]:
            print("[OK] User Registration: Success")
            user_data = response.json()
        else:
            print(f"[ERROR] User Registration: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"[ERROR] User Registration: {e}")
        return
    
    # Test 3: Login
    login_data = {
        "username": "testuser",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/login/", json=login_data)
        if response.status_code == 200:
            print("[OK] User Login: Success")
            tokens = response.json()
            access_token = tokens['access']
        else:
            print(f"[ERROR] User Login: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"[ERROR] User Login: {e}")
        return
    
    # Test 4: Get profile
    headers = {"Authorization": f"Bearer {access_token}"}
    try:
        response = requests.get(f"{BASE_URL}/profile/", headers=headers)
        if response.status_code == 200:
            print("[OK] Get Profile: Success")
        else:
            print(f"[ERROR] Get Profile: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"[ERROR] Get Profile: {e}")
    
    # Test 5: Get dashboard
    try:
        response = requests.get(f"{BASE_URL}/dashboard/", headers=headers)
        if response.status_code == 200:
            print("[OK] Get Dashboard: Success")
        else:
            print(f"[ERROR] Get Dashboard: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"[ERROR] Get Dashboard: {e}")
    
    # Test 6: Create donor profile
    donor_data = {
        "blood_group": "O+",
        "address": "123 Test Street",
        "city": "Test City",
        "state": "Test State",
        "pincode": "12345",
        "weight": 70,
        "height": 175,
        "emergency_contact": "9876543210"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/donors/", json=donor_data, headers=headers)
        if response.status_code in [200, 201]:
            print("[OK] Create Donor Profile: Success")
        else:
            print(f"[ERROR] Create Donor Profile: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"[ERROR] Create Donor Profile: {e}")
    
    # Test 7: Create blood request
    request_data = {
        "patient_name": "Test Patient",
        "blood_group": "A+",
        "units_required": 2,
        "urgency": "HIGH",
        "hospital_name": "Test Hospital",
        "hospital_address": "456 Hospital Road",
        "city": "Test City",
        "state": "Test State",
        "pincode": "12345",
        "contact_person": "Test Contact",
        "contact_phone": "9876543210",
        "required_date": "2024-12-31",
        "description": "Test blood request"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/blood-requests/", json=request_data, headers=headers)
        if response.status_code in [200, 201]:
            print("[OK] Create Blood Request: Success")
            request_id = response.json()['id']
        else:
            print(f"[ERROR] Create Blood Request: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"[ERROR] Create Blood Request: {e}")
    
    # Test 8: Get notifications
    try:
        response = requests.get(f"{BASE_URL}/notifications/", headers=headers)
        if response.status_code == 200:
            print("[OK] Get Notifications: Success")
        else:
            print(f"[ERROR] Get Notifications: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"[ERROR] Get Notifications: {e}")
    
    print("=" * 50)
    print("API Testing Complete!")
    print("\nNext Steps:")
    print("1. Start the frontend: cd lifelink_frontend && npm run dev")
    print("2. Visit http://localhost:5173")
    print("3. Register a new user or login with testuser/testpass123")

if __name__ == "__main__":
    test_api()
