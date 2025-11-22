// import React, { useState } from 'react';
// import { bloodRequestAPI } from '../services/api';

// export default function BloodRequestForm({ onSuccess, onCancel }) {
//   const [formData, setFormData] = useState({
//     patient_name: '',
//     blood_group: '',
//     units_required: 1,
//     urgency: 'MEDIUM',
//     hospital_name: '',
//     hospital_address: '',
//     city: '',
//     state: '',
//     pincode: '',
//     contact_person: '',
//     contact_phone: '',
//     required_date: '',
//     description: '',
//   });

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [matches, setMatches] = useState(null);

//   const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
//   const urgencyLevels = [
//     { value: 'CRITICAL', label: 'Critical - Immediate need' },
//     { value: 'HIGH', label: 'High - Within 24 hours' },
//     { value: 'MEDIUM', label: 'Medium - Within 3 days' },
//     { value: 'LOW', label: 'Low - Within a week' },
//   ];

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//     if (error) setError(null);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);
//     setMatches(null);

//     try {
//       const response = await bloodRequestAPI.createBloodRequest(formData);

//       if (response?.data?.id) {
//         // Immediately find matches after creating a request
//         const matchResponse = await bloodRequestAPI.findMatches(response.data.id);

//         if (matchResponse?.data) {
//           setMatches(matchResponse.data);
//         }

//         // Callback to refresh parent or list
//         onSuccess?.(response.data);
//       } else {
//         setError('Unexpected response from server.');
//       }
//     } catch (err) {
//       console.error('Failed to create blood request:', err);
//       setError('Failed to create blood request. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-4xl mx-auto p-6">
//       <div className="bg-white shadow-lg rounded-lg">
//         {/* HEADER */}
//         <div className="px-6 py-4 border-b border-gray-200">
//           <h2 className="text-2xl font-bold text-gray-900">Create Blood Request</h2>
//           <p className="text-gray-600 mt-1">Fill in the details to request blood donation</p>
//         </div>

//         <div className="p-6">
//           {/* ERROR MESSAGE */}
//           {error && (
//             <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
//               <p className="text-sm text-red-600">{error}</p>
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-6">
//             {/* PATIENT INFO */}
//             <div>
//               <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 {/* Name */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Patient Name *</label>
//                   <input
//                     type="text"
//                     name="patient_name"
//                     value={formData.patient_name}
//                     onChange={handleChange}
//                     required
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
//                     placeholder="Enter patient's full name"
//                   />
//                 </div>

//                 {/* Blood Group */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group Required *</label>
//                   <select
//                     name="blood_group"
//                     value={formData.blood_group}
//                     onChange={handleChange}
//                     required
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
//                   >
//                     <option value="">Select Blood Group</option>
//                     {bloodGroups.map((group) => (
//                       <option key={group} value={group}>
//                         {group}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 {/* Units */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Units Required *</label>
//                   <input
//                     type="number"
//                     name="units_required"
//                     value={formData.units_required}
//                     onChange={handleChange}
//                     min="1"
//                     max="10"
//                     required
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
//                   />
//                 </div>

//                 {/* Urgency */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Level *</label>
//                   <select
//                     name="urgency"
//                     value={formData.urgency}
//                     onChange={handleChange}
//                     required
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
//                   >
//                     {urgencyLevels.map((level) => (
//                       <option key={level.value} value={level.value}>
//                         {level.label}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>
//             </div>

//             {/* HOSPITAL INFO */}
//             <div>
//               <h3 className="text-lg font-semibold text-gray-900 mb-4">Hospital Information</h3>
//               <div className="space-y-6">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Name *</label>
//                   <input
//                     type="text"
//                     name="hospital_name"
//                     value={formData.hospital_name}
//                     onChange={handleChange}
//                     required
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
//                     placeholder="Enter hospital name"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Address *</label>
//                   <textarea
//                     name="hospital_address"
//                     value={formData.hospital_address}
//                     onChange={handleChange}
//                     required
//                     rows="3"
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
//                     placeholder="Enter complete hospital address"
//                   />
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                   <InputField name="city" label="City" formData={formData} onChange={handleChange} />
//                   <InputField name="state" label="State" formData={formData} onChange={handleChange} />
//                   <InputField name="pincode" label="Pincode" formData={formData} onChange={handleChange} />
//                 </div>
//               </div>
//             </div>

//             {/* CONTACT INFO */}
//             <div>
//               <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <InputField name="contact_person" label="Contact Person" formData={formData} onChange={handleChange} />
//                 <InputField
//                   name="contact_phone"
//                   label="Contact Phone"
//                   type="tel"
//                   formData={formData}
//                   onChange={handleChange}
//                 />
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Required Date *</label>
//                   <input
//                     type="date"
//                     name="required_date"
//                     value={formData.required_date}
//                     onChange={handleChange}
//                     required
//                     min={new Date().toISOString().split('T')[0]}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* ADDITIONAL INFO */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information</label>
//               <textarea
//                 name="description"
//                 value={formData.description}
//                 onChange={handleChange}
//                 rows="4"
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
//                 placeholder="Any additional details about the patient's condition..."
//               />
//             </div>

//             {/* ACTION BUTTONS */}
//             <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
//               <button
//                 type="button"
//                 onClick={onCancel}
//                 className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
//               >
//                 {loading ? 'Creating Request...' : 'Create Blood Request'}
//               </button>
//             </div>
//           </form>

//           {/* ✅ MATCH RESULTS */}
//           {matches && (
//             <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-md">
//               <h3 className="text-xl font-semibold text-green-700 mb-3">
//                 🩸 Matches Found: {matches.matches_found}
//               </h3>
//               {matches.matches.length > 0 ? (
//                 matches.matches.map((match) => (
//                   <div
//                     key={match.donor_id}
//                     className="p-4 mb-3 bg-white border border-gray-200 rounded-md shadow-sm"
//                   >
//                     <p className="text-lg font-semibold text-gray-800">Donor: {match.donor_name}</p>
//                     <p className="text-gray-700">Blood Group: {match.blood_group}</p>
//                     <p className="text-gray-700">
//                       Overall Score: <span className="font-semibold">{match.overall_score}</span>
//                     </p>
//                     <p className="text-gray-700">
//                       Success Probability:{' '}
//                       <span className="font-semibold">{match.success_probability}</span>
//                     </p>
//                     <p className="text-gray-700">
//                       Distance: <span className="font-semibold">{match.distance_km} km</span>
//                     </p>
//                   </div>
//                 ))
//               ) : (
//                 <p className="text-gray-600">No matches found for this request.</p>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// /** 🔹 Helper for repeated input fields */
// function InputField({ name, label, type = 'text', formData, onChange }) {
//   const value = formData[name] || '';
//   return (
//     <div>
//       <label className="block text-sm font-medium text-gray-700 mb-2">{label} *</label>
//       <input
//         type={type}
//         name={name}
//         value={value}
//         onChange={onChange}
//         required
//         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
//       />
//     </div>
//   );
// }



// // previously above code was
// import React, { useState } from 'react';
// import { bloodRequestAPI } from '../services/api';

// export default function BloodRequestForm({ onSuccess, onCancel }) {
//   const [formData, setFormData] = useState({
//     patient_name: '',
//     blood_group: '',
//     units_required: 1,
//     urgency: 'MEDIUM',
//     hospital_name: '',
//     hospital_address: '',
//     city: '',
//     state: '',
//     pincode: '',
//     contact_person: '',
//     contact_phone: '',
//     required_date: '',
//     description: ''
//   });

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
//   const urgencyLevels = [
//     { value: 'CRITICAL', label: 'Critical - Immediate need', color: 'text-red-600' },
//     { value: 'HIGH', label: 'High - Within 24 hours', color: 'text-orange-600' },
//     { value: 'MEDIUM', label: 'Medium - Within 3 days', color: 'text-yellow-600' },
//     { value: 'LOW', label: 'Low - Within a week', color: 'text-green-600' }
//   ];

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value
//     });
//     if (error) setError(null);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);

//     try {
//       const response = await bloodRequestAPI.createBloodRequest(formData);
      
//       // Automatically find matches for the new request
//       if (response.data.id) {
//         await bloodRequestAPI.findMatches(response.data.id);
//       }
      
//       onSuccess?.(response.data);
//     } catch (error) {
//       console.error('Failed to create blood request:', error);
//       setError('Failed to create blood request. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-4xl mx-auto p-6">
//       <div className="bg-white shadow-lg rounded-lg">
//         <div className="px-6 py-4 border-b border-gray-200">
//           <h2 className="text-2xl font-bold text-gray-900">Create Blood Request</h2>
//           <p className="text-gray-600 mt-1">Fill in the details to request blood donation</p>
//         </div>

//         <div className="p-6">
//           {error && (
//             <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
//               <p className="text-sm text-red-600">{error}</p>
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-6">
//             {/* Patient Information */}
//             <div>
//               <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Patient Name *
//                   </label>
//                   <input
//                     type="text"
//                     name="patient_name"
//                     value={formData.patient_name}
//                     onChange={handleChange}
//                     required
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
//                     placeholder="Enter patient's full name"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Blood Group Required *
//                   </label>
//                   <select
//                     name="blood_group"
//                     value={formData.blood_group}
//                     onChange={handleChange}
//                     required
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
//                   >
//                     <option value="">Select Blood Group</option>
//                     {bloodGroups.map(group => (
//                       <option key={group} value={group}>{group}</option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Units Required *
//                   </label>
//                   <input
//                     type="number"
//                     name="units_required"
//                     value={formData.units_required}
//                     onChange={handleChange}
//                     min="1"
//                     max="10"
//                     required
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Urgency Level *
//                   </label>
//                   <select
//                     name="urgency"
//                     value={formData.urgency}
//                     onChange={handleChange}
//                     required
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
//                   >
//                     {urgencyLevels.map(level => (
//                       <option key={level.value} value={level.value}>
//                         {level.label}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>
//             </div>

//             {/* Hospital Information */}
//             <div>
//               <h3 className="text-lg font-semibold text-gray-900 mb-4">Hospital Information</h3>
//               <div className="space-y-6">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Hospital Name *
//                   </label>
//                   <input
//                     type="text"
//                     name="hospital_name"
//                     value={formData.hospital_name}
//                     onChange={handleChange}
//                     required
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
//                     placeholder="Enter hospital name"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Hospital Address *
//                   </label>
//                   <textarea
//                     name="hospital_address"
//                     value={formData.hospital_address}
//                     onChange={handleChange}
//                     required
//                     rows="3"
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
//                     placeholder="Enter complete hospital address"
//                   />
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       City *
//                     </label>
//                     <input
//                       type="text"
//                       name="city"
//                       value={formData.city}
//                       onChange={handleChange}
//                       required
//                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       State *
//                     </label>
//                     <input
//                       type="text"
//                       name="state"
//                       value={formData.state}
//                       onChange={handleChange}
//                       required
//                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Pincode *
//                     </label>
//                     <input
//                       type="text"
//                       name="pincode"
//                       value={formData.pincode}
//                       onChange={handleChange}
//                       required
//                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Contact Information */}
//             <div>
//               <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Contact Person *
//                   </label>
//                   <input
//                     type="text"
//                     name="contact_person"
//                     value={formData.contact_person}
//                     onChange={handleChange}
//                     required
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
//                     placeholder="Person to contact for coordination"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Contact Phone *
//                   </label>
//                   <input
//                     type="tel"
//                     name="contact_phone"
//                     value={formData.contact_phone}
//                     onChange={handleChange}
//                     required
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
//                     placeholder="Phone number for contact"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Required Date *
//                   </label>
//                   <input
//                     type="date"
//                     name="required_date"
//                     value={formData.required_date}
//                     onChange={handleChange}
//                     required
//                     min={new Date().toISOString().split('T')[0]}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* Additional Information */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Additional Information
//               </label>
//               <textarea
//                 name="description"
//                 value={formData.description}
//                 onChange={handleChange}
//                 rows="4"
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
//                 placeholder="Any additional details about the patient's condition or special requirements..."
//               />
//             </div>

//             {/* Submit Buttons */}
//             <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
//               <button
//                 type="button"
//                 onClick={onCancel}
//                 className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
//               >
//                 {loading ? 'Creating Request...' : 'Create Blood Request'}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }



import { useState } from 'react';
import toast from 'react-hot-toast';
import { bloodRequestAPI } from '../services/api';

export default function BloodRequestForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    patient_name: '',
    blood_group: '',
    units_required: 1,
    urgency: 'MEDIUM',
    hospital_name: '',
    hospital_address: '',
    city: '',
    state: '',
    pincode: '',
    contact_person: '',
    contact_phone: '',
    required_date: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const urgencyLevels = [
    { value: 'CRITICAL', label: 'Critical - Immediate need', color: 'text-red-600' },
    { value: 'HIGH', label: 'High - Within 24 hours', color: 'text-orange-600' },
    { value: 'MEDIUM', label: 'Medium - Within 3 days', color: 'text-yellow-600' },
    { value: 'LOW', label: 'Low - Within a week', color: 'text-green-600' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const toastId = toast.loading('Creating blood request...');

    try {
      const response = await bloodRequestAPI.createBloodRequest(formData);

      // Automatically find donor matches
      if (response.data.id) {
        await bloodRequestAPI.findMatches(response.data.id);
      }

      toast.success('Blood request created successfully! 🩸', {
        id: toastId,
      });
      onSuccess?.(response.data);
    } catch (error) {
      console.error('Failed to create blood request:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create blood request. Please try again.';
      toast.error(errorMessage, {
        id: toastId,
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create Blood Request</h2>
          <p className="text-gray-600 mt-1">Fill in the details to request blood donation</p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    name="patient_name"
                    value={formData.patient_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter patient's full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Group Required *
                  </label>
                  <select
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Select Blood Group</option>
                    {bloodGroups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Units Required *
                  </label>
                  <input
                    type="number"
                    name="units_required"
                    value={formData.units_required}
                    onChange={handleChange}
                    min="1"
                    max="10"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency Level *
                  </label>
                  <select
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  >
                    {urgencyLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Hospital Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hospital Information</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hospital Name *
                  </label>
                  <input
                    type="text"
                    name="hospital_name"
                    value={formData.hospital_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter hospital name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hospital Address *
                  </label>
                  <textarea
                    name="hospital_address"
                    value={formData.hospital_address}
                    onChange={handleChange}
                    required
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter complete hospital address"
                  />
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    placeholder="Person to contact for coordination"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    placeholder="Phone number for contact"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Date *
                  </label>
                  <input
                    type="date"
                    name="required_date"
                    value={formData.required_date}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Information
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="Any additional details about the patient's condition or special requirements..."
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating Request...' : 'Create Blood Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
