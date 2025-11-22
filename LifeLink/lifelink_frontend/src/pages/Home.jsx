import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #FEE2E2 100%)' }}>
      {/* Modern Navigation */}
      <nav className="bg-white shadow-md backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #DC2626, #B91C1C)' }}>
                <span className="text-xl sm:text-2xl">🩸</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-bold" style={{ color: '#DC2626' }}>LifeLink</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg font-semibold transition-all hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #DC2626, #B91C1C)', color: 'white' }}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base font-medium transition-colors hover:text-opacity-80"
                    style={{ color: '#1E293B' }}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg font-semibold transition-all hover:shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #DC2626, #B91C1C)', color: 'white' }}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Modern Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
        <div className="text-center">
          <div className="inline-block mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full" style={{ background: '#FEE2E2', color: '#991B1B' }}>
            <span className="text-xs sm:text-sm font-semibold">✨ AI-Powered Blood Donation Platform</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6" style={{ color: '#1E293B' }}>
            <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl">🩸</span>
            <br />
            Save Lives with
            <br />
            <span style={{ background: 'linear-gradient(135deg, #DC2626, #1E40AF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              LifeLink
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-10 max-w-3xl mx-auto px-4" style={{ color: '#64748B' }}>
            Connect donors and recipients instantly with our advanced ML algorithms.
            <br className="hidden sm:block" />
            Accurate matching based on blood type, location, and availability.
          </p>
          
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-bold transition-all hover:shadow-2xl transform hover:-translate-y-1 inline-flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #DC2626, #B91C1C)', color: 'white' }}
              >
                <span>🚀</span>
                Join Our Community
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-bold transition-all hover:shadow-lg border-2 inline-flex items-center justify-center gap-2"
                style={{ borderColor: '#DC2626', color: '#DC2626', background: 'white' }}
              >
                Sign In
                <span>→</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Modern Features Section */}
      <div className="bg-white py-12 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4" style={{ color: '#1E293B' }}>
              How LifeLink Works
            </h2>
            <p className="text-base sm:text-lg md:text-xl px-4" style={{ color: '#64748B' }}>
              Our AI-powered platform makes blood donation matching simple and efficient
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            <div className="text-center group px-4">
              <div className="relative inline-block mb-4 sm:mb-6">
                <div className="absolute inset-0 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity" style={{ background: 'linear-gradient(135deg, #DC2626, #EF4444)' }}></div>
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'linear-gradient(135deg, #DC2626, #EF4444)' }}>
                  <span className="text-3xl sm:text-4xl">🩸</span>
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3" style={{ color: '#1E293B' }}>For Donors</h3>
              <p className="text-sm sm:text-base" style={{ color: '#64748B' }}>
                Register as a donor, set your availability, and get matched with recipients in need. 
                Track your donation history and make a real difference in your community.
              </p>
            </div>

            <div className="text-center group px-4">
              <div className="relative inline-block mb-4 sm:mb-6">
                <div className="absolute inset-0 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity" style={{ background: 'linear-gradient(135deg, #1E40AF, #3B82F6)' }}></div>
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'linear-gradient(135deg, #1E40AF, #3B82F6)' }}>
                  <span className="text-3xl sm:text-4xl">🏥</span>
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3" style={{ color: '#1E293B' }}>For Recipients</h3>
              <p className="text-sm sm:text-base" style={{ color: '#64748B' }}>
                Create blood requests with urgency levels. Our AI finds the best matching donors 
                based on location, blood type, availability, and health compatibility.
              </p>
            </div>

            <div className="text-center group px-4 sm:col-span-2 md:col-span-1">
              <div className="relative inline-block mb-4 sm:mb-6">
                <div className="absolute inset-0 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity" style={{ background: 'linear-gradient(135deg, #1E293B, #475569)' }}></div>
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'linear-gradient(135deg, #1E293B, #475569)' }}>
                  <span className="text-3xl sm:text-4xl">🤖</span>
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3" style={{ color: '#1E293B' }}>AI Matching</h3>
              <p className="text-sm sm:text-base" style={{ color: '#64748B' }}>
                Advanced machine learning algorithms consider blood compatibility, location proximity, 
                urgency, donor reliability, and health factors for optimal matches.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Stats Section */}
      <div className="py-12 sm:py-16 lg:py-20" style={{ background: 'linear-gradient(135deg, #DC2626, #B91C1C)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 text-center">
            <div className="group">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-1 sm:mb-2 transform group-hover:scale-110 transition-transform">1000+</div>
              <div className="text-red-100 text-sm sm:text-base lg:text-lg">Lives Saved</div>
            </div>
            <div className="group">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-1 sm:mb-2 transform group-hover:scale-110 transition-transform">500+</div>
              <div className="text-red-100 text-sm sm:text-base lg:text-lg">Active Donors</div>
            </div>
            <div className="group">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-1 sm:mb-2 transform group-hover:scale-110 transition-transform">200+</div>
              <div className="text-red-100 text-sm sm:text-base lg:text-lg">Hospitals</div>
            </div>
            <div className="group">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-1 sm:mb-2 transform group-hover:scale-110 transition-transform">95%</div>
              <div className="text-red-100 text-sm sm:text-base lg:text-lg">Match Accuracy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern CTA Section */}
      {!isAuthenticated && (
        <div className="py-12 sm:py-20 lg:py-24" style={{ background: 'linear-gradient(to bottom, #F8FAFC, #FFFFFF)' }}>
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <div className="inline-block mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full" style={{ background: '#FEE2E2', color: '#991B1B' }}>
              <span className="text-xs sm:text-sm font-semibold">❤️ Join the Movement</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6" style={{ color: '#1E293B' }}>
              Ready to Make a Difference?
            </h2>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-10 px-4" style={{ color: '#64748B' }}>
              Join thousands of people who are saving lives through blood donation.
              <br className="hidden sm:block" />
              Every donation counts. Every match matters.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 sm:gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-xl text-base sm:text-lg md:text-xl font-bold transition-all hover:shadow-2xl transform hover:-translate-y-1"
              style={{ background: 'linear-gradient(135deg, #DC2626, #B91C1C)', color: 'white' }}
            >
              <span>🚀</span>
              Get Started Today
              <span>→</span>
            </Link>
          </div>
        </div>
      )}

      {/* Modern Footer */}
      <footer style={{ background: '#1E293B' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #DC2626, #B91C1C)' }}>
                <span className="text-xl sm:text-2xl">🩸</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-white">LifeLink</span>
            </div>
            <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">Saving lives, one donation at a time.</p>
            <p className="text-gray-500 text-xs sm:text-sm px-4">
              &copy; TeamAlpha 2025. All rights reserved. | Built with ❤️ using AI & ML
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
