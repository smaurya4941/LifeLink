# 🩸 LifeLink - AI-Powered Blood Donation Matcher

LifeLink is a comprehensive blood donation matching platform that connects donors and recipients using advanced machine learning algorithms. The system provides role-based access for donors, recipients, and administrators, with real-time matching and notification capabilities.

## 🚀 Features

### Core Functionality
- **AI-Powered Matching**: ML algorithm considers blood compatibility, location, urgency, and donor availability
- **Role-Based Access**: Separate interfaces for donors, recipients, and administrators
- **Real-Time Notifications**: Instant updates on matches and status changes
- **Blood Group Compatibility**: Accurate blood type matching matrix
- **Location-Based Matching**: Geographic proximity consideration
- **Urgency Handling**: Priority-based matching for critical cases

### User Features
- **Donor Management**: Profile creation, availability tracking, donation history
- **Blood Request System**: Create requests with urgency levels and detailed information
- **Match Management**: Accept/reject matches with detailed donor information
- **Dashboard**: Comprehensive overview with statistics and quick actions
- **Notification System**: Real-time updates and alerts

### Admin Features
- **User Management**: Complete user and profile administration
- **Request Management**: Monitor and manage all blood requests
- **Match Oversight**: Track all donor-recipient matches
- **Analytics**: System statistics and performance metrics

## 🛠 Tech Stack

### Backend
- **Django 5.2.7**: Web framework
- **Django REST Framework**: API development
- **JWT Authentication**: Secure token-based auth
- **SQLite**: Database (easily upgradeable to PostgreSQL)
- **Python ML Libraries**: Scikit-learn, Pandas, NumPy

### Frontend
- **React 19**: User interface
- **Tailwind CSS**: Styling and responsive design
- **React Router**: Navigation
- **Axios**: HTTP client
- **Context API**: State management

## 📋 Prerequisites

- Python 3.10+
- Node.js 16+
- npm or yarn

## 🚀 Installation & Setup

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd lifelink_backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations**
   ```bash
   python manage.py migrate
   ```

5. **Create superuser (optional)**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start development server**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd lifelink_frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## 🌐 Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin
- **API Documentation**: http://localhost:8000/api/



## 🔧 API Endpoints

### Authentication
- `POST /api/register/` - User registration
- `POST /api/login/` - User login
- `POST /api/logout/` - User logout
- `GET /api/profile/` - Get user profile
- `PATCH /api/profile/` - Update user profile

### Donors
- `GET /api/donors/` - List donors
- `POST /api/donors/` - Create donor profile
- `GET /api/donors/{id}/` - Get donor details
- `PATCH /api/donors/{id}/` - Update donor profile
- `GET /api/donors/available_donors/` - Get available donors

### Blood Requests
- `GET /api/blood-requests/` - List blood requests
- `POST /api/blood-requests/` - Create blood request
- `GET /api/blood-requests/{id}/` - Get request details
- `PATCH /api/blood-requests/{id}/` - Update request
- `DELETE /api/blood-requests/{id}/` - Delete request
- `POST /api/blood-requests/{id}/find_matches/` - Find matches

### Matches
- `GET /api/matches/` - List matches
- `GET /api/matches/{id}/` - Get match details
- `POST /api/matches/{id}/accept_match/` - Accept match
- `POST /api/matches/{id}/reject_match/` - Reject match

### Notifications
- `GET /api/notifications/` - List notifications
- `POST /api/notifications/{id}/mark_read/` - Mark as read
- `POST /api/notifications/mark_all_read/` - Mark all as read

## 🧠 ML Matching Algorithm

The matching algorithm considers multiple factors:

1. **Blood Group Compatibility (40%)**
   - Exact match: 40 points
   - Universal donors (O-, O+): 35 points
   - Compatible groups: 30 points

2. **Location Proximity (25%)**
   - Same city: 25 points
   - Same state: 15 points

3. **Urgency Factor (20%)**
   - Critical: 20 points
   - High: 15 points
   - Medium: 10 points
   - Low: 5 points

4. **Donor Verification (10%)**
   - Verified donors: 10 points

5. **Recent Activity (5%)**
   - Eligible to donate: 5 points

## 📱 User Roles

### Donor
- Create and manage donor profile
- Set availability status
- View and respond to matches
- Track donation history
- Update personal information

### Recipient
- Create blood requests
- Set urgency levels
- View and manage matches
- Track request status
- Contact matched donors

### Admin
- Manage all users and profiles
- Monitor system activity
- Oversee matches and requests
- Access analytics and reports

## 🔒 Security Features

- JWT token-based authentication
- Password validation
- CORS protection
- Input validation and sanitization
- Role-based access control
- Secure API endpoints

## 🚀 Deployment

### Backend Deployment
1. Set up production database (PostgreSQL recommended)
2. Configure environment variables
3. Set `DEBUG=False` in settings
4. Deploy to your preferred platform (Heroku, AWS, etc.)

### Frontend Deployment
1. Build production version: `npm run build`
2. Deploy to static hosting (Netlify, Vercel, etc.)
3. Update API base URL for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🎯 Future Enhancements

- Real-time chat between donors and recipients
- Mobile app development
- Advanced analytics dashboard
- Integration with hospital systems
- SMS/Email notifications
- Blood bank integration
- Advanced ML models for better matching

---

**LifeLink** - Saving lives, one donation at a time. 🩸❤️