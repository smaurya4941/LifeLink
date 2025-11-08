import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, notificationAPI, analyticsAPI } from '../services/api';
import DonorProfile from '../components/DonorProfile';
import RecipientProfile from '../components/RecipientProfile';
import BloodRequestForm from '../components/BloodRequestForm';
import DonorRequestsView from '../components/DonorRequestsView';
import RecipientRequestsView from '../components/RecipientRequestsView';
import DonorMatchesView from '../components/DonorMatchesView';
import RecipientMatchesView from '../components/RecipientMatchesView';
import BloodDonationMap from '../components/BloodDonationMap';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, Legend, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showBloodRequestForm, setShowBloodRequestForm] = useState(false);

  // Analytics modal state
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    overview: {},
    trends: [],
    bloodGroupDistribution: [],
    locationStats: [],
    successRates: [],
    donorActivity: [],
    urgentRequests: []
  });
  const [analyticsError, setAnalyticsError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [dashboardResponse, notificationsResponse] = await Promise.all([
          authAPI.getDashboard(),
          notificationAPI.getNotifications({ limit: 5 })
        ]);

        setDashboardData(dashboardResponse.data);
        setNotifications(notificationsResponse.data.results || notificationsResponse.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch analytics when modal opens
  useEffect(() => {
    if (!analyticsOpen) return;

    let cancelled = false;
    const fetchAnalytics = async () => {
      try {
        setAnalyticsLoading(true);
        setAnalyticsError(null);
        const res = await analyticsAPI.getAnalytics('30d'); // default range
        if (!cancelled) {
          setAnalyticsData(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        if (!cancelled) setAnalyticsError('Unable to load analytics. Try again later.');
      } finally {
        if (!cancelled) setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
    return () => {
      cancelled = true;
    };
  }, [analyticsOpen]);

  const handleLogout = async () => {
    await logout();
  };

  const handleBloodRequestSuccess = () => {
    setShowBloodRequestForm(false);
    // refresh dashboard data after creating request
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'requests', name: user?.is_donor ? 'Available Requests' : 'My Requests', icon: '🏥' },
    { id: 'matches', name: 'Matches', icon: '🤝' },
    { id: 'map', name: 'Map', icon: '🗺️' },
  ];

  // Use real backend data for activity chart; fallback to empty array
  const chartData = dashboardData?.activity || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-6">
              <h1 className="text-3xl font-bold text-red-600">🩸 LifeLink</h1>
              {/* Quick access for analytics (modal) */}
              <button
                onClick={() => setAnalyticsOpen(true)}
                className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 transition"
                title="Open Analytics"
              >
                View Analytics
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.first_name || user?.username}!</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {user?.is_donor && (
                  <div className="bg-white shadow rounded-lg p-5">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-red-100 rounded-md flex items-center justify-center text-red-600 text-lg">🩸</div>
                      <div className="ml-4">
                        <h4 className="text-sm font-medium text-gray-600">Donations</h4>
                        <p className="text-xl font-semibold text-gray-900">
                          {dashboardData?.stats?.total_donations ?? 0}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-500">
                      ✅ {dashboardData?.stats?.accepted_matches ?? 0} accepted | ⏳ {dashboardData?.stats?.pending_matches ?? 0} pending
                    </div>
                  </div>
                )}

                {user?.is_recipient && (
                  <div className="bg-white shadow rounded-lg p-5">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-md flex items-center justify-center text-blue-600 text-lg">🏥</div>
                      <div className="ml-4">
                        <h4 className="text-sm font-medium text-gray-600">Requests</h4>
                        <p className="text-xl font-semibold text-gray-900">
                          {dashboardData?.stats?.total_requests ?? 0}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-500">
                      🎯 {dashboardData?.stats?.matched_requests ?? 0} matched | 🕓 {dashboardData?.stats?.pending_requests ?? 0} pending
                    </div>
                  </div>
                )}

                <div className="bg-white shadow rounded-lg p-5">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-md flex items-center justify-center text-green-600 text-lg">📅</div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-gray-600">Last Active</h4>
                      <p className="text-xl font-semibold text-gray-900">
                        {dashboardData?.stats?.last_active || 'Today'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-gray-500">
                    🔔 {notifications?.length} new notifications
                  </div>
                </div>
              </div>

              {/* Activity Chart */}
              <div className="bg-white shadow rounded-lg p-6 mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Activity</h3>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="donations" stroke="#dc2626" strokeWidth={2} />
                      <Line type="monotone" dataKey="requests" stroke="#2563eb" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500">No activity data available.</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white shadow rounded-lg mb-8 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {user?.is_donor && (
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Update Donor Profile
                    </button>
                  )}

                  {user?.is_recipient && (
                    <button
                      onClick={() => setShowBloodRequestForm(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Create Blood Request
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab('matches')}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    View All Matches
                  </button>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white shadow rounded-lg p-6 mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Notifications</h3>
                {notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-3 rounded-md ${n.is_read ? 'bg-gray-50' : 'bg-blue-50 border-l-4 border-blue-400'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{n.title}</p>
                            <p className="text-sm text-gray-600">{n.message}</p>
                          </div>
                          <span className="text-xs text-gray-500">{new Date(n.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No notifications yet</p>
                )}
              </div>
            </>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <>
              {user?.is_donor && <DonorProfile />}
              {user?.is_recipient && <RecipientProfile />}
            </>
          )}

          {/* REQUESTS TAB */}
          {activeTab === 'requests' && (
            <div>
              {user?.is_donor ? (
                <DonorRequestsView />
              ) : (
                <RecipientRequestsView onCreateNew={() => setShowBloodRequestForm(true)} />
              )}
            </div>
          )}

          {/* MATCHES TAB */}
          {activeTab === 'matches' && (
            <>
              {user?.is_donor ? (
                <DonorMatchesView />
              ) : (
                <RecipientMatchesView />
              )}
            </>
          )}

          {/* MAP TAB */}
          {activeTab === 'map' && (
            <div>
              <BloodDonationMap />
            </div>
          )}
        </div>
      </div>

      {/* Blood Request Modal */}
      {showBloodRequestForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-end">
              <button
                onClick={() => setShowBloodRequestForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <BloodRequestForm
              onSuccess={handleBloodRequestSuccess}
              onCancel={() => setShowBloodRequestForm(false)}
            />
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {analyticsOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setAnalyticsOpen(false)} />
          <div className="relative z-10 w-full max-w-6xl bg-white rounded-lg shadow-lg overflow-auto max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Analytics (Last 30 days)</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAnalyticsOpen(false)}
                  className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6">
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                </div>
              ) : analyticsError ? (
                <div className="text-center text-red-600 py-8">{analyticsError}</div>
              ) : (
                <>
                  {/* Overview metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-white border rounded">
                      <p className="text-sm text-gray-600">Total Matches</p>
                      <p className="text-2xl font-bold">{analyticsData.overview.total_matches ?? 0}</p>
                    </div>
                    <div className="p-4 bg-white border rounded">
                      <p className="text-sm text-gray-600">Active Donors</p>
                      <p className="text-2xl font-bold">{analyticsData.overview.active_donors ?? 0}</p>
                    </div>
                    <div className="p-4 bg-white border rounded">
                      <p className="text-sm text-gray-600">Success Rate</p>
                      <p className="text-2xl font-bold">{(analyticsData.overview.success_rate ?? 0).toFixed(1)}%</p>
                    </div>
                    <div className="p-4 bg-white border rounded">
                      <p className="text-sm text-gray-600">Urgent Requests</p>
                      <p className="text-2xl font-bold">{analyticsData.overview.urgent_requests ?? 0}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Trends AreaChart */}
                    <div className="bg-white p-4 border rounded">
                      <h4 className="font-medium mb-3">Matching Trends</h4>
                      <div style={{ width: '100%', height: 260 }}>
                        <ResponsiveContainer>
                          <AreaChart data={analyticsData.trends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Area type="monotone" dataKey="matches" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                            <Area type="monotone" dataKey="donations" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Blood group distribution */}
                    <div className="bg-white p-4 border rounded">
                      <h4 className="font-medium mb-3">Blood Group Distribution</h4>
                      <div style={{ width: '100%', height: 260 }}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie
                              data={analyticsData.bloodGroupDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {(analyticsData.bloodGroupDistribution || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Location + Success rate small charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <div className="bg-white p-4 border rounded">
                      <h4 className="font-medium mb-3">Top Locations</h4>
                      <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer>
                          <BarChart data={analyticsData.locationStats}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="city" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="matches" fill="#10B981" />
                            <Bar dataKey="donations" fill="#3B82F6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white p-4 border rounded">
                      <h4 className="font-medium mb-3">Success Rate by Blood Group</h4>
                      <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer>
                          <BarChart data={analyticsData.successRates}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="blood_group" />
                            <YAxis />
                            <Tooltip formatter={(value) => `${value}%`} />
                            <Bar dataKey="success_rate" fill="#F59E0B" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Recent urgent requests - list */}
                  <div className="mt-6 bg-white p-4 border rounded">
                    <h4 className="font-medium mb-3">Recent Urgent Requests</h4>
                    <div className="max-h-48 overflow-auto">
                      {analyticsData.urgentRequests && analyticsData.urgentRequests.length > 0 ? (
                        <ul className="space-y-2">
                          {analyticsData.urgentRequests.map((r, i) => (
                            <li key={i} className="p-2 border rounded">
                              <div className="flex justify-between">
                                <div>
                                  <div className="font-medium">{r.patient_name} — <span className="text-xs text-gray-500">{r.blood_group}</span></div>
                                  <div className="text-sm text-gray-500">{r.city}, {r.state} • {r.urgency}</div>
                                </div>
                                <div className="text-sm text-gray-500">{new Date(r.created_at).toLocaleDateString()}</div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">No urgent requests found.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
