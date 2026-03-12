# MilkNet Backend — Express + MongoDB + AWS S3 + Razorpay

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI, AWS keys, Razorpay keys

# 3. Seed the database (optional)
npm run seed

# 4. Start dev server
npm run dev   # → http://localhost:5000
```

---

## Project Structure

```
milknet-server/
├── index.js               ← Express app entry point
├── package.json
├── .env                   ← Never commit this
├── config/
│   ├── db.js              ← MongoDB connection
│   ├── s3.js              ← AWS S3 client
│   └── razorpay.js        ← Razorpay instance
├── models/
│   ├── User.js            ← Customer + Milkman accounts
│   ├── Milkman.js         ← Milkman profile + documents
│   ├── Payment.js         ← Razorpay payment records
│   ├── Review.js          ← Customer reviews
│   └── Subscription.js    ← Customer ↔ Milkman subscriptions
├── controllers/
│   ├── authController.js
│   ├── milkmanController.js
│   ├── paymentController.js
│   ├── uploadController.js
│   ├── reviewController.js
│   └── subscriptionController.js
├── routes/
│   ├── authRoutes.js
│   ├── milkmanRoutes.js
│   ├── paymentRoutes.js
│   ├── uploadRoutes.js
│   ├── reviewRoutes.js
│   └── subscriptionRoutes.js
├── middleware/
│   ├── authMiddleware.js  ← JWT protect, requireRole, optionalAuth
│   ├── validate.js        ← express-validator error handler
│   └── errorHandler.js    ← asyncHandler wrapper
└── utils/
    └── seed.js            ← Populate DB with sample data
```

---

## API Endpoints

### Auth  `/api/auth`
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/register` | Public | Register customer or milkman |
| POST | `/login` | Public | Login, returns JWT |
| GET | `/me` | Protected | Get logged-in user |
| PATCH | `/update-profile` | Protected | Update name, phone, area |
| PATCH | `/change-password` | Protected | Change password |

### Milkmen  `/api/milkmen`
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/` | Public | List all (search, filter, sort, paginate) |
| GET | `/:id` | Public | Get single milkman + reviews |
| GET | `/me` | Milkman | Get own profile |
| PATCH | `/me` | Milkman | Update own profile |
| PATCH | `/me/availability` | Milkman | Toggle available on/off |

### Payments  `/api/payments`
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/create-order` | Customer | Create Razorpay order |
| POST | `/verify` | Customer | Verify payment signature |
| GET | `/my` | Customer | My payment history |
| GET | `/summary` | Customer | Monthly chart data |
| GET | `/milkman` | Milkman | Payments received |

### Upload  `/api/upload`
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/presign` | Protected | Get S3 presigned PUT URL |
| POST | `/confirm` | Milkman | Save uploaded doc to profile |
| DELETE | `/document/:docId` | Milkman | Delete document from S3 + DB |
| GET | `/signed-url/:s3Key` | Protected | Get temporary read URL |

### Reviews  `/api/reviews`
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/:milkmanId` | Public | Get milkman's reviews |
| POST | `/:milkmanId` | Customer | Add/update review |
| DELETE | `/:reviewId` | Customer | Delete own review |

### Subscriptions  `/api/subscriptions`
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/` | Customer | Subscribe to a milkman |
| GET | `/my` | Customer | Get my active subscription |
| PATCH | `/:id/cancel` | Customer | Cancel subscription |
| PATCH | `/:id/autopay` | Customer | Toggle auto-pay |
| GET | `/milkman/subscribers` | Milkman | See my subscribers |

---

## Razorpay Integration Flow

```
1. Customer clicks "Pay" 
   → POST /api/payments/create-order  → returns { orderId, amount, keyId }

2. Frontend opens Razorpay modal with orderId

3. Customer completes payment on Razorpay

4. Razorpay calls frontend callback with { razorpayPaymentId, razorpaySignature }

5. Frontend calls POST /api/payments/verify with all three IDs

6. Backend verifies HMAC signature → marks payment as 'paid' in DB
```

## AWS S3 Upload Flow

```
1. Frontend calls POST /api/upload/presign  → returns { presignedUrl, fileUrl, s3Key }

2. Frontend PUTs file directly to S3 using presignedUrl (no server involved)

3. Frontend calls POST /api/upload/confirm  → saves s3Key + fileUrl to milkman.documents[]
```

## Test Accounts (after npm run seed)
- **Customer**: arun@milknet.com / password123
- **Milkman**: ramesh@milknet.com / password123
