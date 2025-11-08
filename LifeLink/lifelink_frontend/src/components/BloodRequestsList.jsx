import React, { useEffect, useState } from 'react';
import { bloodRequestAPI } from '../services/api';

export default function BloodRequestsList() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [matches, setMatches] = useState({}); // ✅ store matches per request

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') {
        params.status = filter;
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

  const handleFindMatches = async (requestId) => {
    try {
      const response = await bloodRequestAPI.findMatches(requestId);
      const matchData = response.data.matches || response.data; // ✅ Works for both formats
  
      console.log("Matches found:", matchData);
  
      setMatches((prev) => ({
        ...prev,
        [requestId]: matchData,
      }));
    } catch (error) {
      console.error('Failed to find matches:', error);
      alert('Failed to find matches. Check console for details.');
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'MATCHED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'CRITICAL': return 'text-red-600 font-bold';
      case 'HIGH': return 'text-orange-600 font-semibold';
      case 'MEDIUM': return 'text-yellow-600';
      case 'LOW': return 'text-green-600';
      default: return 'text-gray-600';
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
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Blood Requests</h2>
            <div className="flex space-x-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">All Requests</option>
                <option value="PENDING">Pending</option>
                <option value="MATCHED">Matched</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {requests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No blood requests found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.patient_name}
                      </h3>
                      <p className="text-sm text-gray-600">{request.hospital_name}</p>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                      <span className={`text-sm ${getUrgencyColor(request.urgency)}`}>
                        {request.urgency}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Blood Group:</span>
                      <span className="ml-2 text-sm text-gray-900 font-semibold">{request.blood_group}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Units Required:</span>
                      <span className="ml-2 text-sm text-gray-900">{request.units_required}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Required Date:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {new Date(request.required_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Location:</span>
                      <p className="text-sm text-gray-900">
                        {request.city}, {request.state} - {request.pincode}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Contact:</span>
                      <p className="text-sm text-gray-900">
                        {request.contact_person} - {request.contact_phone}
                      </p>
                    </div>
                  </div>

                  {request.description && (
                    <div className="mb-4">
                      <span className="text-sm font-medium text-gray-500">Description:</span>
                      <p className="text-sm text-gray-900 mt-1">{request.description}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-500">
                      Created: {new Date(request.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      {matches[request.id] ? (
                        <button
                          onClick={() => setMatches((prev) => ({ ...prev, [request.id]: null }))}
                          className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
                        >
                          Hide Matches
                        </button>
                      ) : (
                        request.status === 'PENDING' && (
                          <button
                            onClick={() => handleFindMatches(request.id)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                          >
                            Find Matches
                          </button>
                        )
                      )}
                      <button className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* ✅ Show matches below each request */}
                  {matches[request.id] && matches[request.id].length > 0 && (
                    <div className="mt-4 bg-gray-50 p-4 rounded-md border border-gray-200">
                      <h4 className="text-md font-semibold text-gray-800 mb-2">
                        Matched Donors ({matches[request.id].length})
                      </h4>
                      {matches[request.id].map((match, index) => (
                        <div key={index} className="p-3 mb-2 bg-white rounded-md shadow-sm border">
                          <p><strong>Name:</strong> {match.donor_name}</p>
                          <p><strong>Blood Group:</strong> {match.blood_group}</p>
                          <p><strong>Overall Score:</strong> {match.overall_score}</p>
                          <p><strong>Distance:</strong> {match.distance_km} km</p>
                          <p><strong>Success Probability:</strong> {match.success_probability}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
