# Ternapay - Payment Processing Frontend

A modern, responsive web application for user authentication and payment processing with Razorpay integration.

## 🚀 Features

- **User Authentication**: Sign up, login, and logout functionality
- **Dashboard**: View recent payments and payment statistics
- **Payment Creation**: Create new payments with idempotency protection
- **Payment History**: Browse all past transactions with detailed information
- **Razorpay Checkout**: Integrated payment modal with real-time status
- **Loading Animations**: Visual feedback during operations
- **Error Handling**: Clear, user-friendly error messages
- **Responsive Design**: Works on desktop and tablet devices
- **Session Management**: Persistent login with JWT tokens

## 📋 Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Server**: Python HTTP server (port 8080)
- **Storage**: LocalStorage for session management
- **Payment Gateway**: Razorpay Checkout
- **API Client**: Fetch API with custom wrapper

## 🛠️ Installation

### Prerequisites
- Python 3+ (for HTTP server)
- Backend API running on `http://localhost:3001`

### Setup

```bash
# Navigate to frontend directory
cd frontend

# Start HTTP server (Python 3)
python3 -m http.server 8080

# Or use Node.js http-server
npx http-server -p 8080

# Or use any other static file server
```

Open your browser and navigate to: `http://localhost:8080`

## 📁 Project Structure

```
frontend/
├── index.html              # Home/landing page
├── signup.html             # User registration
├── login.html              # User login
├── dashboard.html          # Main dashboard with recent payments
├── createPayment.html      # Payment creation form
├── paymentHistory.html     # Complete payment history
├── styles.css              # Global stylesheet
└── js/
    └── api.js              # API client and utilities
```

## 📄 Pages

### Home (index.html)
Landing page with:
- Project branding and logo
- Feature highlights
- Call-to-action buttons (Get Started / Go to Dashboard)
- Auth-aware navigation

### Signup (signup.html)
User registration with:
- Name, email, password fields
- Form validation
- Password strength indicators
- Loading animation on submit
- Error messages
- Link to login page

### Login (login.html)
User authentication with:
- Email and password fields
- Remember me option
- Loading spinner
- Error handling
- JWT token storage
- Redirect to dashboard on success

### Dashboard (dashboard.html)
Main user interface showing:
- Welcome greeting with user name
- Create Payment button
- Recent Payments widget (last 5 transactions)
- Payment history link
- Logout button
- Column headers: Txn ID | Status | Amount | Date | Time
- Color-coded payment status (success/pending/failed)

### Create Payment (createPayment.html)
Payment creation form with:
- Amount input field
- Payment description
- Form validation
- Idempotency key generation and display
- Duplicate payment warning
- Razorpay Checkout modal integration
- Success/failure animations
- Automatic redirect to dashboard

### Payment History (paymentHistory.html)
Complete transaction list with:
- All user payments (paginated if needed)
- Transaction ID, Status, Amount, Date, Time columns
- Status indicators with icons
- Color-coded states
- Back to dashboard link
- Loading/error states

## 🔐 Authentication Flow

1. **Signup**: Create new account → Store credentials
2. **Login**: Enter email/password → Receive JWT token
3. **Session**: JWT stored in localStorage with user data
4. **Protected Routes**: Check token before accessing dashboard
5. **Logout**: Clear token and redirect to login

## 💳 Payment Flow

1. **Create Payment**: User enters amount and submits form
2. **Generate Order**: Backend creates Razorpay order, returns order ID
3. **Open Modal**: Frontend loads Razorpay script and opens checkout
4. **User Pays**: User enters card/UPI details in modal
5. **Webhook**: Razorpay notifies backend of payment
6. **Verify**: Backend verifies payment signature
7. **Update Status**: Payment status updated in database
8. **Redirect**: Frontend detects completion and redirects to dashboard

## 🛡️ Idempotency Protection

The frontend implements idempotency keys to prevent duplicate payments:

```javascript
// Auto-generates: order_${userId}_${timestamp}_${random}
// Shows in form for reference
// Backend uses to detect duplicates
// Returns HTTP 200 if duplicate detected
```

**Benefits**:
- Safe to retry failed payments
- Network failures don't create duplicate orders
- Prevents accidental double-clicks from creating charges

## 🎨 Styling

### Color Scheme
- **Primary**: Purple gradient (`#6b21a8` to `#06b6d4`)
- **Success**: Teal (`#6ee7b7`)
- **Error**: Red (`#ff6b7a`)
- **Pending**: Amber (`#f59e0b`)
- **Background**: Dark blue gradient

### Responsive Grid
- **Container**: 1200px max-width
- **Payment Rows**: 5-column layout (1.2fr 0.9fr 0.7fr 0.8fr 0.8fr)
- **Cards**: Full-width with consistent padding
- **Mobile**: Adapts to smaller screens

### Animations
- **Loading Spinner**: CSS keyframe animation (0.8s rotation)
- **Modal**: Fade-in (0.3s) + Slide-up (0.4s)
- **Checkmark**: Animated green ✓ on success
- **X Mark**: Animated red ✕ on failure

## 🔌 API Integration

### Headers
```javascript
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

### Key Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/v1/users/signup` | Create account |
| POST | `/v1/users/login` | Authenticate user |
| POST | `/v1/payments/create-order` | Create payment order |
| POST | `/v1/payments/verify-payment` | Verify payment |
| GET | `/v1/payments/paymenthistory/{userId}` | Fetch payment history |

## 💾 LocalStorage Schema

```javascript
{
  "ternapay_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "ternapay_user": {
    "_id": "user_id",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

## 🧪 Testing Payment

### Test Cards (Razorpay)
- **Success**: 4111 1111 1111 1111
- **Failed**: 4000 0000 0000 0002
- **OTP**: Any 6-digit number
- **CVV**: Any 3-digit number

### Test Flow
1. Navigate to `http://localhost:8080`
2. Sign up with test email
3. Login with credentials
4. Click "Create Payment"
5. Enter amount (e.g., 100)
6. Click "Create Order"
7. Use test card in modal
8. Verify success on dashboard

## 🚀 Deployment

### Static Hosting (Netlify, Vercel, etc.)

```bash
# Build step (if needed)
# No build required - pure static files

# Deploy folder
# Point to: frontend/
```

### Environment Configuration

Update `frontend/js/api.js` for production:

```javascript
const API_BASE = 'https://api.ternapay.com'; // Production API
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name ternapay.com;
    
    location / {
        root /var/www/frontend;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend:3001;
    }
}
```

## 🐛 Troubleshooting

### "Cannot reach API"
- Ensure backend is running on port 3001
- Check CORS settings in backend
- Verify API_BASE URL in `api.js`

### "Token expired"
- Clear localStorage: `localStorage.clear()`
- Re-login to get new token

### "Payment modal not opening"
- Check browser console for errors
- Verify Razorpay key is correct
- Ensure backend returns `razorpayKey`

### "Duplicate payment warning"
- Expected behavior when retrying same order
- Use new idempotency key by reloading page
- Or use different amount

## 📱 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🔒 Security Notes

- JWT tokens stored in localStorage (consider httpOnly cookies)
- Never commit `.env` files
- Always use HTTPS in production
- Validate all user inputs
- Verify payment signatures on backend

## 📝 License

MIT

