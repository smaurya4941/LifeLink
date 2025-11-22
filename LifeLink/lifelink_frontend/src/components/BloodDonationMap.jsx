import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { bloodRequestAPI, donorAPI } from '../services/api';

const mapContainerStyle = {
  width: '100%',
  height: '500px'
};

const defaultCenter = {
  lat: 28.6139, // Delhi coordinates
  lng: 77.2090
};

// Fix default icon paths for Leaflet in bundlers (Vite)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const coloredIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41]
});

export default function BloodDonationMap() {
  const [map, setMap] = useState(null);
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(10);
  const [donors, setDonors] = useState([]);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [filterBloodGroup, setFilterBloodGroup] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [showDonors, setShowDonors] = useState(true);
  const [showRequests, setShowRequests] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mapRef = useRef(null);
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    if (!loading && containerRef.current && !mapRef.current) {
      // console.log("✅ Map init after loading");
      const instance = L.map(containerRef.current).setView([defaultCenter.lat, defaultCenter.lng], zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(instance);
      mapRef.current = instance;
      setMap(instance);
    }
  }, [loading]);

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 200);
    }
  }, [loading]);
  
  
  useEffect(() => {
    getUserLocation();
    fetchMapData();
  }, []);


  // Recenter when user location available
  useEffect(() => {
    if (mapRef.current && userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 12);
    }
  }, [userLocation]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Unable to get your location. Using default location.');
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  const fetchMapData = async () => {
    try {
      setLoading(true);
      const [donorsResponse, requestsResponse] = await Promise.all([
        donorAPI.getDonors({ available: true }),
        bloodRequestAPI.getBloodRequests({ status: 'PENDING' })
      ]);
      // console.log('Donors API Response:', donorsResponse.data);

      setDonors(donorsResponse.data.results || donorsResponse.data);
      setBloodRequests(requestsResponse.data.results || requestsResponse.data);
      
    } catch (error) {
      console.error('Failed to fetch map data:', error);
      setError('Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  const getMarkerIcon = (type, urgency = null) => {
    const baseUrl = 'https://maps.google.com/mapfiles/ms/icons/';
    
    if (type === 'donor') {
      return `${baseUrl}green-dot.png`;
    } else if (type === 'request') {
      switch (urgency) {
        case 'CRITICAL':
          return `${baseUrl}red-dot.png`;
        case 'HIGH':
          return `${baseUrl}orange-dot.png`;
        case 'MEDIUM':
          return `${baseUrl}yellow-dot.png`;
        default:
          return `${baseUrl}blue-dot.png`;
      }
    }
    return `${baseUrl}blue-dot.png`;
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const filteredDonors = donors.filter(donor => {
    
    const lat = parseFloat(donor.latitude ?? donor.user?.latitude ?? 0);
    const lng = parseFloat(donor.longitude ?? donor.user?.longitude ?? 0);
    // console.log(lat, lng);
    // console.log('Donors State:', donors);
    if (!lat || !lng) return false;
    return filterBloodGroup === 'all' || donor.blood_group === filterBloodGroup;
    
  });
  // console.log('Filtered Donors:', filteredDonors); 

  const filteredRequests = bloodRequests.filter(request => {
    const lat = parseFloat(request.latitude ?? request.user?.latitude ?? 0);
    const lng = parseFloat(request.longitude ?? request.user?.longitude ?? 0);
    if (!lat || !lng) return false;
    return (
      (filterBloodGroup === 'all' || request.blood_group === filterBloodGroup) &&
      (filterUrgency === 'all' || request.urgency === filterUrgency)
    );
  });

  // Marker icon helpers
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
  const coloredIcon = (color) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png', shadowSize: [41, 41]
  });

  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
  };

  const handleMapClick = () => {
    setSelectedMarker(null);
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      'CRITICAL': 'text-red-600',
      'HIGH': 'text-orange-600',
      'MEDIUM': 'text-yellow-600',
      'LOW': 'text-green-600'
    };
    return colors[urgency] || 'text-gray-600';
  };

  const getUrgencyBgColor = (urgency) => {
    const colors = {
      'CRITICAL': 'bg-red-100',
      'HIGH': 'bg-orange-100',
      'MEDIUM': 'bg-yellow-100',
      'LOW': 'bg-green-100'
    };
    return colors[urgency] || 'bg-gray-100';
  };



  // Render markers when data changes (must be before any early returns to keep hooks order stable)
  useEffect(() => {
    // console.log('useEffect triggered with filteredDonors:', filteredDonors);
    
    // console.log('Show Donors:', showDonors);
    // if (!mapRef.current) {
    //   console.log('Map not initialized');
    //   return;
    // }
    
    if (!mapRef.current) return;
    // clear existing layers group if exists
    if (mapRef.current._donorLayer) {
      mapRef.current.removeLayer(mapRef.current._donorLayer);
    }
    if (mapRef.current._requestLayer) {
      mapRef.current.removeLayer(mapRef.current._requestLayer);
    }
    const donorLayer = L.layerGroup();
    const requestLayer = L.layerGroup();
    
    // console.log('Show Donors:', showDonors);
    if (showDonors) {
      filteredDonors.forEach((donor) => {
        // console.log('Adding marker for donor:', donor); // Log each donor being added
        const lat = parseFloat(donor.latitude ?? donor.user?.latitude ?? 0);
        const lng = parseFloat(donor.longitude ?? donor.user?.longitude ?? 0);
        // console.log('Marker coordinates:', lat, lng); // Log marker coordinates
        if (!lat || !lng) return;
        const marker = L.marker([lat, lng], { icon: coloredIcon('green') });
        const popup = `
          <div class="p-2 max-w-xs">
            <h3 class="font-semibold text-green-600 mb-2">🩸 Blood Donor</h3>
            <p class="text-sm"><strong>Name:</strong> ${donor.user?.username || ''}</p>
            <p class="text-sm"><strong>Blood Group:</strong> ${donor.blood_group}</p>
            <p class="text-sm"><strong>Location:</strong> ${donor.city}, ${donor.state}</p>
          </div>`;
        marker.bindPopup(popup);
        donorLayer.addLayer(marker);
      });
    }

    if (showRequests) {
      filteredRequests.forEach((request) => {
        const lat = parseFloat(request.latitude ?? request.user?.latitude ?? 0);
        const lng = parseFloat(request.longitude ?? request.user?.longitude ?? 0);
        if (!lat || !lng) return;
        const color = request.urgency === 'CRITICAL' ? 'red' : request.urgency === 'HIGH' ? 'orange' : request.urgency === 'MEDIUM' ? 'yellow' : 'blue';
        const marker = L.marker([lat, lng], { icon: coloredIcon(color) });
        const popup = `
          <div class="p-2 max-w-xs">
            <h3 class="font-semibold text-red-600 mb-2">🚨 Blood Request</h3>
            <p class="text-sm"><strong>Patient:</strong> ${request.patient_name}</p>
            <p class="text-sm"><strong>Blood Group:</strong> ${request.blood_group}</p>
            <p class="text-sm"><strong>Hospital:</strong> ${request.hospital_name}</p>
            <p class="text-sm"><strong>Location:</strong> ${request.city}, ${request.state}</p>
          </div>`;
        marker.bindPopup(popup);
        requestLayer.addLayer(marker);
      });
    }
   
    donorLayer.addTo(mapRef.current);
    requestLayer.addTo(mapRef.current);
    mapRef.current._donorLayer = donorLayer;
    mapRef.current._requestLayer = requestLayer;
  }, [filteredDonors, filteredRequests, showDonors, showRequests]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Blood Group Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Blood Group:</label>
            <select
              value={filterBloodGroup}
              onChange={(e) => setFilterBloodGroup(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">All</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          {/* Urgency Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Urgency:</label>
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">All</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Toggle Layers */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showDonors}
                onChange={(e) => setShowDonors(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Show Donors</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showRequests}
                onChange={(e) => setShowRequests(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Show Requests</span>
            </label>
          </div>

          {/* Location Button */}
          <button
            onClick={getUserLocation}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            📍 My Location
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div ref={containerRef} style={mapContainerStyle} />
      </div>

      {/* Legend */}
      <div className="mt-4 bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Map Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Donors</h4>
            <div className="flex items-center space-x-2 mb-1">
              <img src="https://maps.google.com/mapfiles/ms/icons/green-dot.png" alt="Donor" className="w-4 h-4" />
              <span className="text-sm text-gray-600">Available Donors</span>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Blood Requests</h4>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <img src="https://maps.google.com/mapfiles/ms/icons/red-dot.png" alt="Critical" className="w-4 h-4" />
                <span className="text-sm text-gray-600">Critical</span>
              </div>
              <div className="flex items-center space-x-2">
                <img src="https://maps.google.com/mapfiles/ms/icons/orange-dot.png" alt="High" className="w-4 h-4" />
                <span className="text-sm text-gray-600">High</span>
              </div>
              <div className="flex items-center space-x-2">
                <img src="https://maps.google.com/mapfiles/ms/icons/yellow-dot.png" alt="Medium" className="w-4 h-4" />
                <span className="text-sm text-gray-600">Medium</span>
              </div>
              <div className="flex items-center space-x-2">
                <img src="https://maps.google.com/mapfiles/ms/icons/blue-dot.png" alt="Low" className="w-4 h-4" />
                <span className="text-sm text-gray-600">Low</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
