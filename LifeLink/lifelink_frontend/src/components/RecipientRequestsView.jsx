import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { bloodRequestAPI } from '../services/api';
import BloodDonationMap from './BloodDonationMap';

export default function RecipientRequestsView({ onCreateNew }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showMap, setShowMap] = useState(false);
  const [matches, setMatches] = useState({});

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
    const toastId = toast.loading('Finding matches...');
    try {
      const response = await bloodRequestAPI.findMatches(requestId);
      const matchData = response.data.matches || response.data;
      setMatches((prev) => ({
        ...prev,
        [requestId]: matchData,
      }));
      const count = Array.isArray(matchData) ? matchData.length : 0;
      toast.success(`Found ${count} potential match${count !== 1 ? 'es' : ''}!`, {
        id: toastId,
      });
    } catch (error) {
      console.error('Failed to find matches:', error);
      toast.error('Failed to find matches. Please try again.', {
        id: toastId,
      });
    }
  };

  const handleConfirmDonor = async (requestId, donorId) => {
    const toastId = toast.loading('Confirming donor...');
    try {
      const response = await bloodRequestAPI.confirmDonor(requestId, { donor_id: donorId });
      toast.success('Donor confirmed successfully! 🩸', {
        id: toastId,
        duration: 5000,
      });
      fetchRequests();
      setMatches((prev) => ({ ...prev, [requestId]: null }));
    } catch (error) {
      console.error('Failed to confirm donor:', error);
      toast.error('Failed to confirm donor. Please try again.', {
        id: toastId,
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'MATCHED': return 'bg-blue-100 text-blue-800';
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800';
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
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">My Blood Requests</h2>
          <p className="text-gray-600 mt-1">Manage your blood donation requests</p>
        </div>
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
          >
            <option value="all">All Requests</option>
            <option value="PENDING">Pending</option>
            <option value="MATCHED">Matched</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            + New Request
          </button>
          <button
            onClick={() => setShowMap(!showMap)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
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
              <p className="text-gray-500 text-lg">No blood requests found.</p>
              <button
                onClick={onCreateNew}
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Your First Request
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((request) => (
                <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {request.patient_name}
                      </h3>
                      <p className="text-sm text-gray-600">{request.hospital_name}</p>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                        {request.urgency}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Blood Group:</span>
                      <span className="ml-2 text-lg text-gray-900 font-bold">{request.blood_group}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Units Required:</span>
                      <span className="ml-2 text-lg text-gray-900">{request.units_required}</span>
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
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium text-gray-500">Description:</span>
                      <p className="text-sm text-gray-900 mt-1">{request.description}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      Created: {new Date(request.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      {request.status === 'PENDING' && (
                        <button
                          onClick={() => handleFindMatches(request.id)}
                          className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                        >
                          Find Matches
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Show matches if available */}
                  {matches[request.id] && matches[request.id].length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-3">
                        Matched Donors ({matches[request.id].length})
                      </h4>
                      <div className="space-y-3">
                        {matches[request.id].map((match, index) => (
                          <div key={index} className="p-3 bg-white rounded-lg border border-blue-100">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{match.donor_name}</p>
                                <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                                  <span><strong>Blood Group:</strong> {match.blood_group}</span>
                                  <span><strong>Match Score:</strong> {(match.overall_score * 100).toFixed(1)}%</span>
                                  <span><strong>Distance:</strong> {match.distance_km?.toFixed(1) || 'N/A'} km</span>
                                  <span><strong>Success Probability:</strong> {(match.success_probability * 100).toFixed(1)}%</span>
                                </div>
                              </div>
                              {request.status === 'MATCHED' && (
                                <button
                                  onClick={() => handleConfirmDonor(request.id, match.donor_id)}
                                  className="ml-4 px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                                >
                                  Confirm Donor
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
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
