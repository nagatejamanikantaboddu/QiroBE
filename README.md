# Ternapay - Payment Processing Backend

A production-ready Node.js backend for processing payments with Razorpay integration, Redis caching, and comprehensive error handling.

## 🚀 Features

- **Payment Processing**: Create and verify payments using Razorpay Checkout
- **Idempotency**: Prevent duplicate payments with idempotency key implementation
- **Redis Caching**: Cache user data, sessions, and payment history for optimal performance
- **Webhook Deduplication**: Prevent duplicate webhook processing with event deduplication
- **JWT Authentication**: Secure user authentication and authorization
- **Input Validation**: Comprehensive Joi validation for all endpoints
- **Error Handling**: Centralized error handling with custom error classes
- **Logging**: Request logging with Morgan and application logging with Winston
- **Security**: Helmet, XSS protection, MongoDB sanitization, CORS

## 📋 Tech Stack

- **Runtime**: Node.js (ES modules)
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Cache**: Redis (node-redis)
- **Payment**: Razorpay
- **Authentication**: JWT + bcrypt
- **Validation**: Joi
- **Dev Tools**: Babel, nodemon

## 🛠️ Installation

### Prerequisites
- Node.js 16+
- MongoDB
- Redis
- Razorpay account (for API keys)

### Setup

```bash
# Install dependencies
yarn install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the server
yarn start

# Or run in development mode with watch
yarn dev
```

## 🔧 Environment Variables

Create a `.env` file:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/ternapay

# Redis
REDIS_URL=redis://localhost:6379
# Or individual settings:
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=your_password

# Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_SECRET=your_secret

# JWT
JWT_SECRET=your_jwt_secret

# CORS
CORS_ORIGIN=http://localhost:8080
```

## 📁 Project Structure

```
src/
├── config/
│   ├── APIError.js           # Custom API error class
│   ├── catchAsync.js         # Async error wrapper
│   ├── config.js             # Configuration loader
│   ├── logger.js             # Winston logger setup
│   ├── Master.class.js       # Base service class
│   ├── morgan.js             # Morgan request logger
│   ├── razorpay.config.js    # Razorpay client
│   ├── redis.js              # Redis client
│   └── validation.js         # Joi validation schemas
├── middlewares/
│   ├── Auth.middleware.js       # JWT authentication
│   └── Authforuser.middleware.js # User auth with cache
├── modules/
│   ├── payments/
│   │   ├── payments.controller.js
│   │   ├── payments.model.js
│   │   ├── payments.routes.js
│   │   ├── payments.service.js
│   │   └── payments.validations.js
│   └── users/
│       ├── Users.controller.js
│       ├── Users.model.js
│       ├── Users.routes.js
│       ├── Users.Service.js
│       └── Users.validations.js
├── routes/
│   └── v1/
│       └── index.js          # API v1 routes
└── services/
    └── cacheService.js       # Centralized caching logic
```

## 🔌 API Endpoints

### Authentication
- `POST /v1/users/signup` - Create new user account
- `POST /v1/users/login` - Login with email and password

### Payments
- `POST /v1/payments/create-order` - Create payment order
- `POST /v1/payments/verify-payment` - Verify payment
- `GET /v1/payments/paymenthistory/:userId` - Get user's payment history
- `POST /v1/payments/webhook` - Razorpay webhook

## 💰 Payment Flow

1. **Frontend requests order creation**: POST `/v1/payments/create-order`
   - Backend creates Razorpay order
   - Returns `razorpayOrderId` and `razorpayKey`
   - Generates and returns idempotency key

2. **Frontend opens Razorpay Checkout**: 
   - User completes payment in modal
   - Razorpay calls backend webhook

3. **Backend verifies payment**: 
   - Webhook handler verifies payment signature
   - Stores payment record in database
   - Invalidates user's payment history cache

4. **Idempotency protection**:
   - If duplicate order request detected (same userId + idempotencyKey)
   - Returns cached payment response with HTTP 200
   - Prevents duplicate Razorpay orders

## 🔐 Caching Strategy

### User Data Cache
- **Key**: `user:{userId}`
- **TTL**: 1 hour
- **Invalidated on**: Profile update, logout

### Session Cache
- **Key**: `session:{userId}`
- **TTL**: 24 hours
- **Used for**: Auth middleware cache-first lookup

### Payment History Cache
- **Key**: `paymentHistory:{userId}`
- **TTL**: 5 minutes
- **Invalidated on**: New payment, payment status update

### Webhook Event Deduplication
- **Key**: `webhook:event:{eventId}`
- **TTL**: 24 hours
- **Purpose**: Prevent duplicate webhook processing

## 🔑 Key Features Explained

### Idempotency Keys
Prevents duplicate payment orders when network fails or user retries:
```javascript
// Frontend generates: order_${userId}_${timestamp}_${random}
// Backend checks: findOne({ idempotencyKey, userId })
// Returns cached payment if duplicate detected
```

### Redis Integration
- Graceful shutdown with error handling
- Conditional authentication (URL or host+port+password)
- Socket reconnection strategy
- Used in auth middleware for cache-first user lookups

### Error Handling
All errors inherit from `APIError` class:
```javascript
throw new ApiError(400, 'Invalid payment amount');
```

## 🧪 Testing

```bash
# Run tests (if configured)
yarn test

# Check code quality
yarn lint
```

## 📊 Monitoring

Logs are written by Winston logger to console and files. Check logs at:
```
logs/
├── error.log
└── combined.log
```

## 🚢 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use environment-specific Razorpay keys
- [ ] Enable HTTPS for API
- [ ] Configure CORS for production domain
- [ ] Set strong JWT secret
- [ ] Enable MongoDB authentication
- [ ] Configure Redis persistence
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Enable rate limiting
- [ ] Configure CSRF protection

### Docker
```bash
docker build -t ternapay-backend .
docker run -p 3001:3001 --env-file .env ternapay-backend
```

## 🐛 Troubleshooting

### Redis AUTH Error
**Issue**: `ERR AUTH <password> called without any password configured`
**Solution**: Ensure `REDIS_URL` or `REDIS_PASSWORD` is set correctly in `.env`

### Payment Verification Fails
**Check**:
1. Razorpay keys are correct
2. Webhook signature matches
3. Payment status in Razorpay dashboard

### Duplicate Payment Detected
**Expected behavior**: Returns HTTP 200 with cached payment
**Disable**: Remove idempotency check if not needed

## 📝 License

MIT
