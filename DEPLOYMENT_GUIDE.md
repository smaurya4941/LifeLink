# 🚀 LifeLink Deployment Guide

## Production Deployment Instructions

### Prerequisites
- Python 3.10+
- Node.js 16+
- PostgreSQL (recommended for production)
- Web server (Nginx recommended)
- SSL certificate

### Backend Deployment

#### 1. Environment Setup
```bash
# Create production environment
python -m venv venv_prod
source venv_prod/bin/activate  # On Windows: venv_prod\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn psycopg2-binary
```

#### 2. Database Configuration
```python
# In settings.py for production
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'lifelink_prod',
        'USER': 'your_db_user',
        'PASSWORD': 'your_db_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

#### 3. Environment Variables
Create `.env` file:
```env
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgresql://user:password@localhost:5432/lifelink_prod
```

#### 4. Production Settings
```python
# settings.py additions for production
DEBUG = False
ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com']

# Security settings
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# Static files
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

#### 5. Database Migration
```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

#### 6. Gunicorn Configuration
Create `gunicorn.conf.py`:
```python
bind = "0.0.0.0:8000"
workers = 3
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
```

#### 7. Start Production Server
```bash
gunicorn --config gunicorn.conf.py lifelink_backend.wsgi:application
```

### Frontend Deployment

#### 1. Build Production Version
```bash
cd lifelink_frontend
npm run build
```

#### 2. Update API Base URL
```javascript
// In src/services/api.js
const API = axios.create({
  baseURL: "https://yourdomain.com/api/", // Update for production
});
```

#### 3. Deploy to Static Hosting
- **Netlify**: Drag and drop the `dist` folder
- **Vercel**: Connect GitHub repository
- **AWS S3**: Upload files to S3 bucket
- **Nginx**: Serve static files directly

### Nginx Configuration

#### 1. Install Nginx
```bash
sudo apt update
sudo apt install nginx
```

#### 2. Create Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Frontend
    location / {
        root /path/to/lifelink_frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin panel
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static/ {
        alias /path/to/lifelink_backend/staticfiles/;
    }
}
```

### Docker Deployment (Alternative)

#### 1. Backend Dockerfile
```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN python manage.py collectstatic --noinput

EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "lifelink_backend.wsgi:application"]
```

#### 2. Frontend Dockerfile
```dockerfile
FROM node:16-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 3. Docker Compose
```yaml
version: '3.8'
services:
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: lifelink_prod
      POSTGRES_USER: lifelink_user
      POSTGRES_PASSWORD: lifelink_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./lifelink_backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://lifelink_user:lifelink_password@db:5432/lifelink_prod
    depends_on:
      - db

  frontend:
    build: ./lifelink_frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Environment-Specific Configurations

#### Development
```python
DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']
CORS_ALLOW_ALL_ORIGINS = True
```

#### Staging
```python
DEBUG = False
ALLOWED_HOSTS = ['staging.yourdomain.com']
CORS_ALLOWED_ORIGINS = ['https://staging.yourdomain.com']
```

#### Production
```python
DEBUG = False
ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com']
CORS_ALLOWED_ORIGINS = ['https://yourdomain.com', 'https://www.yourdomain.com']
```

### Monitoring and Maintenance

#### 1. Log Management
```bash
# View logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Django logs
python manage.py runserver --verbosity=2
```

#### 2. Database Backup
```bash
# PostgreSQL backup
pg_dump lifelink_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
psql lifelink_prod < backup_file.sql
```

#### 3. SSL Certificate Renewal
```bash
# Using Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Performance Optimization

#### 1. Database Optimization
```python
# Add database indexes
class BloodRequest(models.Model):
    # ... existing fields ...
    
    class Meta:
        indexes = [
            models.Index(fields=['blood_group', 'status']),
            models.Index(fields=['city', 'state']),
            models.Index(fields=['urgency', 'created_at']),
        ]
```

#### 2. Caching
```python
# Redis caching
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}
```

#### 3. CDN Configuration
- Use CloudFlare or AWS CloudFront
- Configure static file serving
- Enable compression and minification

### Security Checklist

- [ ] SSL certificate installed and configured
- [ ] HTTPS redirect enabled
- [ ] Security headers configured
- [ ] Database credentials secured
- [ ] Secret key rotated
- [ ] CORS properly configured
- [ ] Input validation enabled
- [ ] Rate limiting implemented
- [ ] Regular security updates
- [ ] Backup strategy in place

### Troubleshooting

#### Common Issues
1. **CORS Errors**: Check CORS_ALLOWED_ORIGINS configuration
2. **Static Files Not Loading**: Run `collectstatic` and check Nginx configuration
3. **Database Connection**: Verify database credentials and connectivity
4. **SSL Issues**: Check certificate validity and configuration

#### Debug Mode
```python
# Enable debug logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': 'debug.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
```

### Scaling Considerations

1. **Horizontal Scaling**: Use load balancers with multiple backend instances
2. **Database Scaling**: Implement read replicas for read-heavy operations
3. **Caching**: Use Redis for session storage and caching
4. **CDN**: Implement CDN for static file delivery
5. **Monitoring**: Use tools like New Relic or DataDog for performance monitoring

This deployment guide provides comprehensive instructions for deploying LifeLink to production environments with proper security, performance, and scalability considerations.
