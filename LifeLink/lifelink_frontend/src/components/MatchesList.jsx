import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { matchingAPI } from '../services/api';

export default function MatchesList() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchMatches();
  }, [filter]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      
      const response = await matchingAPI.getMatches(params);
      setMatches(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptMatch = async (matchId) => {
    const toastId = toast.loading('Accepting match...');
    try {
      await matchingAPI.acceptMatch(matchId);
      toast.success('Match accepted successfully! 🩸', {
        id: toastId,
      });
      fetchMatches();
    } catch (error) {
      console.error('Failed to accept match:', error);
      toast.error('Failed to accept match. Please try again.', {
        id: toastId,
      });
    }
  };

  const handleRejectMatch = async (matchId) => {
    const toastId = toast.loading('Rejecting match...');
    try {
      await matchingAPI.rejectMatch(matchId, 'Rejected by user');
      toast.success('Match rejected successfully', {
        id: toastId,
      });
      fetchMatches();
    } catch (error) {
      console.error('Failed to reject match:', error);
      toast.error('Failed to reject match. Please try again.', {
        id: toastId,
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
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
            <h2 className="text-2xl font-bold text-gray-900">Donor Matches</h2>
            <div className="flex space-x-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">All Matches</option>
                <option value="PENDING">Pending</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
                <option value="COMPLETED">Completed</option>
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

          {matches.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No matches found.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {matches.map((match) => (
                <div key={match.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Match for {match.blood_request?.patient_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {match.donor?.user?.first_name} {match.donor?.user?.last_name}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                        {match.status}
                      </span>
                      <span className={`text-sm font-semibold ${getScoreColor(match.matching_score)}`}>
                        Score: {(match.matching_score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    {/* Donor Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Donor Information</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Blood Group:</span>
                          <span className="ml-2 text-sm text-gray-900 font-semibold">
                            {match.donor?.blood_group}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Location:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {match.donor?.city}, {match.donor?.state}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Availability:</span>
                          <span className={`ml-2 text-sm ${match.donor?.availability ? 'text-green-600' : 'text-red-600'}`}>
                            {match.donor?.availability ? 'Available' : 'Not Available'}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Can Donate:</span>
                          <span className={`ml-2 text-sm ${match.donor?.can_donate ? 'text-green-600' : 'text-red-600'}`}>
                            {match.donor?.can_donate ? 'Yes' : 'No'}
                          </span>
                        </div>
                        {match.donor?.last_donation_date && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">Last Donation:</span>
                            <span className="ml-2 text-sm text-gray-900">
                              {new Date(match.donor.last_donation_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Request Information */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Request Information</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Blood Group Needed:</span>
                          <span className="ml-2 text-sm text-gray-900 font-semibold">
                            {match.blood_request?.blood_group}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Units Required:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {match.blood_request?.units_required}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Urgency:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {match.blood_request?.urgency}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Hospital:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {match.blood_request?.hospital_name}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Location:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {match.blood_request?.city}, {match.blood_request?.state}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Required Date:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {new Date(match.blood_request?.required_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-yellow-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Contact Person:</span>
                        <span className="ml-2 text-sm text-gray-900">
                          {match.blood_request?.contact_person}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Phone:</span>
                        <span className="ml-2 text-sm text-gray-900">
                          {match.blood_request?.contact_phone}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Matched: {new Date(match.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      {match.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleAcceptMatch(match.id)}
                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                          >
                            Accept Match
                          </button>
                          <button
                            onClick={() => handleRejectMatch(match.id)}
                            className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                          >
                            Reject Match
                          </button>
                        </>
                      )}
                      {match.status === 'ACCEPTED' && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-md">
                          Match Accepted
                        </span>
                      )}
                      {match.status === 'REJECTED' && (
                        <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-md">
                          Match Rejected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
