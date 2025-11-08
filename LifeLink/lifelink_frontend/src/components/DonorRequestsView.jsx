import React, { useState, useEffect } from 'react';
import { bloodRequestAPI, matchingAPI } from '../services/api';
import BloodDonationMap from './BloodDonationMap';

export default function DonorRequestsView() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showMap, setShowMap] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = { status: 'PENDING' }; // Only show pending requests
      if (filter !== 'all') {
        params.urgency = filter;
      }
      const response = await bloodRequestAPI.getBloodRequests(params);
      setRequests(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch blood requests:', error);
      setError('Failed to load blood requests');
    } finally {
      setLoading(false);
    }
  };

  // const handleAcceptMatch = async (requestId, matchId) => {
  //   try {
  //     await matchingAPI.acceptMatch(matchId);
  //     alert('Match accepted! The recipient will be notified.');
  //     fetchRequests();
  //     setSelectedRequest(null);
  //   } catch (error) {
  //     console.error('Failed to accept match:', error);
  //     alert('Failed to accept match. Please try again.');
  //   }
  // };

  const handleAcceptMatch = async (matchId) => {
    if (!matchId) {
      alert('No valid match ID found!');
      return;
    }
  
    console.log("🩸 Accepting match with ID:", matchId); // debug
    try {
      await matchingAPI.acceptMatch(matchId);
      alert('✅ Match accepted! The recipient will be notified.');
      fetchRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('❌ Failed to accept match:', error);
      alert('Failed to accept match. Please try again.');
    }
  };
  
  const handleFindMatches = async (requestId) => {
    try {
      const response = await bloodRequestAPI.findMatches(requestId);
      const matches = response.data.matches || [];
      setSelectedRequest({ id: requestId, matches });
    } catch (error) {
      console.error('Failed to find matches:', error);
      alert('Failed to find matches. Check console for details.');
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'CRITICAL': return 'text-red-600 font-bold bg-red-50';
      case 'HIGH': return 'text-orange-600 font-semibold bg-orange-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'LOW': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Available Blood Requests</h2>
          <p className="text-gray-600 mt-1">Help save lives by responding to requests</p>
        </div>
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
          >
            <option value="all">All Urgencies</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <button
            onClick={() => setShowMap(!showMap)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {showMap ? '📋 List View' : '🗺️ Map View'}
          </button>
        </div>
      </div>

      {/* Map View */}
      {showMap && (
        <div className="mb-6">
          <BloodDonationMap />
        </div>
      )}

      {/* List View */}
      {!showMap && (
        <>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {requests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 text-lg">No available blood requests at the moment.</p>
              <p className="text-gray-400 text-sm mt-2">Check back later or help spread the word!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {requests.map((request) => (
                <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {request.patient_name}
                      </h3>
                      <p className="text-sm text-gray-600">{request.hospital_name}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                      {request.urgency}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Blood Group:</span>
                      <span className="ml-2 text-lg text-gray-900 font-bold">{request.blood_group}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Units:</span>
                      <span className="ml-2 text-lg text-gray-900">{request.units_required}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Required Date:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {new Date(request.required_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Location:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {request.city}, {request.state}
                      </span>
                    </div>
                  </div>

                  {request.description && (
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-700">{request.description}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-xs text-gray-500">
                      Posted {new Date(request.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      {selectedRequest?.id === request.id && selectedRequest.matches ? (
                        <button
                          onClick={() => setSelectedRequest(null)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
                        >
                          Hide Matches
                        </button>
                      ) : (
                        <button
                          onClick={() => handleFindMatches(request.id)}
                          className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                        >
                          Check Compatibility
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Show matches if available */}
                  {selectedRequest?.id === request.id && selectedRequest.matches && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-2">
                        ✅ You're Compatible! Match Score: {selectedRequest.matches[0]?.overall_score?.toFixed(2) || 'N/A'}
                      </h4>
                      <p className="text-sm text-green-700 mb-3">
                        You match the blood group requirements. Distance: {selectedRequest.matches[0]?.distance_km?.toFixed(1) || 'N/A'} km
                      </p>
                      <button
                            onClick={() => handleAcceptMatch(selectedRequest.matches[0]?.match_id)}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                          >
                            Accept & Help Save a Life
                      </button>


                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
