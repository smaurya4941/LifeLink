import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { donorAPI } from '../services/api';

export default function DonorProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    blood_group: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    weight: '',
    height: '',
    medical_conditions: '',
    emergency_contact: '',
    latitude: '',
    longitude: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await donorAPI.getDonors();
      const list = response.data?.results || response.data || [];
      if (Array.isArray(list) && list.length > 0) {
        const donorProfile = list[0];
        setProfile(donorProfile);
        setFormData({
          blood_group: donorProfile.blood_group || '',
          address: donorProfile.address || '',
          city: donorProfile.city || '',
          state: donorProfile.state || '',
          pincode: donorProfile.pincode || '',
          weight: donorProfile.weight || '',
          height: donorProfile.height || '',
          medical_conditions: donorProfile.medical_conditions || '',
          emergency_contact: donorProfile.emergency_contact || '',
          latitude: donorProfile.user?.latitude ?? donorProfile.latitude ?? '',
          longitude: donorProfile.user?.longitude ?? donorProfile.longitude ?? ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch donor profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const toastId = toast.loading(profile ? 'Updating profile...' : 'Creating profile...');

    try {
      if (profile) {
        await donorAPI.updateDonor(profile.id, formData);
        toast.success('Donor profile updated successfully! ✅', {
          id: toastId,
        });
      } else {
        await donorAPI.createDonor(formData);
        toast.success('Donor profile created successfully! 🩸', {
          id: toastId,
        });
      }
      
      await fetchProfile();
      setIsEditing(false);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to save profile';
      toast.error(errorMessage, {
        id: toastId,
      });
      setError(errorMessage);
      console.error('Profile save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser.');
      setError('Geolocation is not supported by this browser.');
      return;
    }

    const toastId = toast.loading('Getting your location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }));
        toast.success('Location captured successfully! 📍', {
          id: toastId,
        });
      },
      (geoError) => {
        console.error('Unable to capture location', geoError);
        const errorMessage = 'Unable to capture location automatically.';
        toast.error(errorMessage, {
          id: toastId,
        });
        setError(errorMessage);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Donor Profile</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                {profile ? 'Edit Profile' : 'Create Profile'}
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Group *
                  </label>
                  <select
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Select Blood Group</option>
                    {bloodGroups.map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    min="45"
                    max="200"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    min="120"
                    max="220"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact
                  </label>
                  <input
                    type="tel"
                    name="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                  <input
                    type="text"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="e.g. 28.6139"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                  <input
                    type="text"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="e.g. 77.2090"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Use Current Location
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Providing your location helps recipients find nearby donors.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical Conditions
                </label>
                <textarea
                  name="medical_conditions"
                  value={formData.medical_conditions}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Any medical conditions or medications..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {profile ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Blood Group:</span>
                          <span className="ml-2 text-sm text-gray-900">{profile.blood_group}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Weight:</span>
                          <span className="ml-2 text-sm text-gray-900">{profile.weight || 'Not specified'} kg</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Height:</span>
                          <span className="ml-2 text-sm text-gray-900">{profile.height || 'Not specified'} cm</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Emergency Contact:</span>
                          <span className="ml-2 text-sm text-gray-900">{profile.emergency_contact || 'Not specified'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Address:</span>
                          <p className="text-sm text-gray-900 mt-1">{profile.address}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">City:</span>
                          <span className="ml-2 text-sm text-gray-900">{profile.city}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">State:</span>
                          <span className="ml-2 text-sm text-gray-900">{profile.state}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Pincode:</span>
                          <span className="ml-2 text-sm text-gray-900">{profile.pincode}</span>
                        </div>
                      {formData.latitude && formData.longitude && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Coordinates:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {parseFloat(formData.latitude).toFixed(5)}, {parseFloat(formData.longitude).toFixed(5)}
                          </span>
                        </div>
                      )}
                      </div>
                    </div>
                  </div>

                  {profile.medical_conditions && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Medical Conditions</h3>
                      <p className="text-sm text-gray-900">{profile.medical_conditions}</p>
                    </div>
                  )}

                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="text-green-400 text-lg">✓</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          {profile.can_donate ? 'You are eligible to donate blood' : 'You are not currently eligible to donate'}
                        </p>
                        {!profile.can_donate && profile.last_donation_date && (
                          <p className="text-sm text-green-700 mt-1">
                            Last donation: {new Date(profile.last_donation_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">You haven't created a donor profile yet.</p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Create Donor Profile
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
