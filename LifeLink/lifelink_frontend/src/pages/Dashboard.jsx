import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis, YAxis
} from 'recharts';
import BloodDonationMap from '../components/BloodDonationMap';
import BloodRequestForm from '../components/BloodRequestForm';
import DonorMatchesView from '../components/DonorMatchesView';
import DonorProfile from '../components/DonorProfile';
import DonorRequestsView from '../components/DonorRequestsView';
import RecipientMatchesView from '../components/RecipientMatchesView';
import RecipientProfile from '../components/RecipientProfile';
import RecipientRequestsView from '../components/RecipientRequestsView';
import { useAuth } from '../contexts/AuthContext';
import { analyticsAPI, authAPI, notificationAPI } from '../services/api';

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
    toast.loading('Logging out...');
    await logout();
    toast.success('Logged out successfully. See you soon! 👋');
  };

  const handleBloodRequestSuccess = async () => {
    setShowBloodRequestForm(false);
    // Refresh dashboard data without full page reload
    try {
      const [dashboardResponse, notificationsResponse] = await Promise.all([
        authAPI.getDashboard(),
        notificationAPI.getNotifications({ limit: 5 })
      ]);
      setDashboardData(dashboardResponse.data);
      setNotifications(notificationsResponse.data.results || notificationsResponse.data);
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom, #F8FAFC, #E2E8F0)' }}>
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-4 rounded-full animate-spin" style={{ borderTopColor: '#DC2626' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🩸</span>
            </div>
          </div>
          <p className="mt-6 text-lg font-semibold" style={{ color: '#1E293B' }}>Loading Dashboard...</p>
          <p className="text-sm mt-2" style={{ color: '#64748B' }}>Please wait while we fetch your data</p>
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
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAFBFC 0%, #F1F5F9 100%)' }}>
      {/* Professional Header */}
      <header className="bg-white border-b sticky top-0 z-40" style={{ borderColor: '#E2E8F0', boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.08)' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}>
                  <span className="text-xl sm:text-2xl filter drop-shadow">🩸</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg sm:text-xl font-bold" style={{ color: '#0F172A', letterSpacing: '-0.025em' }}>LifeLink</h1>
                  <p className="text-xs" style={{ color: '#64748B' }}>Blood Donation Platform</p>
                </div>
              </div>
              <button
                onClick={() => setAnalyticsOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)', color: 'white', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)' }}
                title="Open Analytics"
              >
                <span>📊</span>
                <span>Analytics</span>
              </button>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-lg" style={{ background: '#F1F5F9' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EF4444, #3B82F6)' }}>
                  <span className="text-white font-bold text-sm">{(user?.first_name || user?.username || 'U').charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>{user?.first_name || user?.username}</p>
                  <p className="text-xs" style={{ color: '#64748B' }}>{user?.is_donor ? 'Donor' : 'Recipient'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium transition-all"
                style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: 'white', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modern Navigation */}
      <div className="bg-white sticky top-14 sm:top-16 z-30" style={{ borderBottom: '1px solid #E2E8F0' }}>
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-5 py-2.5 sm:py-3 font-medium text-xs sm:text-sm transition-all whitespace-nowrap border-b-2 flex-shrink-0 ${
                  activeTab === tab.id ? '' : 'border-transparent'
                }`}
                style={{
                  borderBottomColor: activeTab === tab.id ? '#EF4444' : 'transparent',
                  color: activeTab === tab.id ? '#EF4444' : '#64748B',
                  background: activeTab === tab.id ? 'linear-gradient(to bottom, transparent, rgba(239, 68, 68, 0.03))' : 'transparent'
                }}
              >
                <span className="mr-1.5 sm:mr-2">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
        <div className="sm:px-0">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
              {/* Professional Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 mb-6">
                {user?.is_donor && (
                  <div className="bg-white rounded-2xl p-4 sm:p-6 transition-all hover:shadow-lg" style={{ border: '1px solid #E2E8F0' }}>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="p-2 sm:p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))' }}>
                        <span className="text-2xl sm:text-3xl">🩸</span>
                      </div>
                      <div className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'linear-gradient(135deg, #FEE2E2, #FECACA)', color: '#991B1B' }}>
                        Active
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm font-medium mb-1" style={{ color: '#64748B' }}>Total Donations</p>
                    <p className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3" style={{ color: '#0F172A' }}>
                      {dashboardData?.stats?.total_donations ?? 0}
                    </p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 pt-2 sm:pt-3" style={{ borderTop: '1px solid #F1F5F9' }}>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: '#10B981' }}></div>
                        <span className="text-xs font-medium" style={{ color: '#64748B' }}>
                          {dashboardData?.stats?.accepted_matches ?? 0} Accepted
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }}></div>
                        <span className="text-xs font-medium" style={{ color: '#64748B' }}>
                          {dashboardData?.stats?.pending_matches ?? 0} Pending
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {user?.is_recipient && (
                  <div className="bg-white rounded-2xl p-4 sm:p-6 transition-all hover:shadow-lg" style={{ border: '1px solid #E2E8F0' }}>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="p-2 sm:p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))' }}>
                        <span className="text-2xl sm:text-3xl">🏥</span>
                      </div>
                      <div className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)', color: '#1E40AF' }}>
                        Active
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm font-medium mb-1" style={{ color: '#64748B' }}>Total Requests</p>
                    <p className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3" style={{ color: '#0F172A' }}>
                      {dashboardData?.stats?.total_requests ?? 0}
                    </p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 pt-2 sm:pt-3" style={{ borderTop: '1px solid #F1F5F9' }}>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: '#10B981' }}></div>
                        <span className="text-xs font-medium" style={{ color: '#64748B' }}>
                          {dashboardData?.stats?.matched_requests ?? 0} Matched
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }}></div>
                        <span className="text-xs font-medium" style={{ color: '#64748B' }}>
                          {dashboardData?.stats?.pending_requests ?? 0} Pending
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl p-4 sm:p-6 transition-all hover:shadow-lg" style={{ border: '1px solid #E2E8F0' }}>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))' }}>
                      <span className="text-2xl sm:text-3xl">🔔</span>
                    </div>
                    <div className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)', color: '#065F46' }}>
                      Live
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm font-medium mb-1" style={{ color: '#64748B' }}>Notifications</p>
                  <p className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3" style={{ color: '#0F172A' }}>
                    {notifications?.length || 0}
                  </p>
                  <div className="flex items-center gap-1.5 pt-2 sm:pt-3" style={{ borderTop: '1px solid #F1F5F9' }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: '#64748B' }}></div>
                    <span className="text-xs font-medium" style={{ color: '#64748B' }}>
                      Last active: {dashboardData?.stats?.last_active || 'Today'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modern Activity Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: '#1E293B' }}>Monthly Activity</h3>
                    <p className="text-sm" style={{ color: '#64748B' }}>Track your donations and requests</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ background: '#DC2626' }}></div>
                      <span className="text-xs" style={{ color: '#64748B' }}>Donations</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ background: '#2563eb' }}></div>
                      <span className="text-xs" style={{ color: '#64748B' }}>Requests</span>
                    </div>
                  </div>
                </div>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <XAxis dataKey="month" stroke="#64748B" />
                      <YAxis stroke="#64748B" />
                      <Tooltip />
                      <Line type="monotone" dataKey="donations" stroke="#dc2626" strokeWidth={3} dot={{ fill: '#DC2626', r: 4 }} />
                      <Line type="monotone" dataKey="requests" stroke="#2563eb" strokeWidth={3} dot={{ fill: '#2563eb', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">📊</div>
                    <p style={{ color: '#64748B' }}>No activity data available</p>
                  </div>
                )}
              </div>

              {/* Professional Quick Actions */}
              <div className="bg-white rounded-2xl p-6 mb-6" style={{ border: '1px solid #E2E8F0' }}>
                <h3 className="text-lg font-bold mb-5" style={{ color: '#0F172A' }}>Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {user?.is_donor && (
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="flex items-center justify-center gap-2 px-5 py-4 rounded-xl font-semibold text-sm transition-all hover:shadow-lg transform hover:-translate-y-0.5"
                      style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: 'white' }}
                    >
                      <span className="text-lg">👤</span>
                      <span>Update Profile</span>
                    </button>
                  )}

                  {user?.is_recipient && (
                    <button
                      onClick={() => setShowBloodRequestForm(true)}
                      className="flex items-center justify-center gap-2 px-5 py-4 rounded-xl font-semibold text-sm transition-all hover:shadow-lg transform hover:-translate-y-0.5"
                      style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)', color: 'white' }}
                    >
                      <span className="text-lg">➕</span>
                      <span>Create Request</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab('matches')}
                    className="flex items-center justify-center gap-2 px-5 py-4 rounded-xl font-semibold text-sm transition-all hover:shadow-lg transform hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white' }}
                  >
                    <span className="text-lg">🤝</span>
                    <span>View Matches</span>
                  </button>
                </div>
              </div>

              {/* Modern Notifications */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: '#1E293B' }}>Recent Notifications</h3>
                    <p className="text-sm" style={{ color: '#64748B' }}>Stay updated with latest activities</p>
                  </div>
                  {notifications.length > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#FEE2E2', color: '#991B1B' }}>
                      {notifications.length} New
                    </span>
                  )}
                </div>
                {notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-4 rounded-xl transition-all hover:shadow-md ${
                          n.is_read ? 'bg-gray-50' : 'bg-red-50 border-l-4'
                        }`}
                        style={{ borderLeftColor: n.is_read ? 'transparent' : '#DC2626' }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {!n.is_read && (
                                <div className="w-2 h-2 rounded-full" style={{ background: '#DC2626' }}></div>
                              )}
                              <p className="font-semibold" style={{ color: '#1E293B' }}>{n.title}</p>
                            </div>
                            <p className="text-sm" style={{ color: '#64748B' }}>{n.message}</p>
                          </div>
                          <span className="text-xs whitespace-nowrap ml-4" style={{ color: '#94A3B8' }}>
                            {new Date(n.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">🔔</div>
                    <p style={{ color: '#64748B' }}>No notifications yet</p>
                    <p className="text-sm mt-2" style={{ color: '#94A3B8' }}>You'll be notified when there are updates</p>
                  </div>
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
