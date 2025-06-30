# LegalLink Backend Documentation
## Software Requirements Specification - Hackathon Version

### Executive Summary

This Software Requirements Specification outlines the backend development of LegalLink Hackathon Version, a scalable legal services platform designed for rapid prototype development within hackathon constraints. The backend serves as the core API layer, providing authentication, data management, and integration services for the AI-powered legal assistant, advocate matching, and appointment scheduling systems.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [Core Features](#core-features)
5. [API Documentation](#api-documentation)
6. [Database Schema](#database-schema)
7. [Authentication & Security](#authentication--security)
8. [Middleware System](#middleware-system)
9. [Route Structure](#route-structure)
10. [Service Integration](#service-integration)
11. [Deployment and Setup](#deployment-and-setup)
12. [Development Guidelines](#development-guidelines)

---

## Project Overview

LegalLink Backend is a robust Express.js application that powers the legal services platform, providing secure API endpoints, database management, and third-party service integrations. The backend handles user authentication, advocate verification, appointment scheduling, social features, and seamless integration with the AI query assistant.

### Key Objectives
- Provide secure RESTful API endpoints
- Manage user authentication and authorization
- Handle advocate verification and profile management
- Enable appointment scheduling with Google Calendar integration
- Support social features for legal community engagement
- Integrate with AI services for legal query processing
- Ensure data security and privacy compliance

---

## Technology Stack

### Core Technologies
- **Framework**: Express.js 4.16.2
- **Language**: TypeScript 4.9.5
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better-Auth with session management
- **API Documentation**: Swagger (OpenAPI 3.0)
- **Build Tool**: ESBuild
- **Runtime**: Node.js 16+

### Key Dependencies
- **Database & ORM**: `@prisma/client`, `prisma`
- **Authentication**: `better-auth`
- **File Upload**: `multer`, `cloudinary`
- **Email Services**: `resend`, `nodemailer`
- **Calendar Integration**: `googleapis`
- **Security**: `cors`, `cookie-parser`
- **Documentation**: `swagger-jsdoc`, `swagger-ui-express`

### Development Tools
- **Package Manager**: npm/pnpm
- **Process Manager**: nodemon
- **Code Quality**: ESLint, TypeScript compiler
- **Database Migration**: Prisma migrate

---

## Architecture Overview

```
backend/
├── src/
│   ├── app.ts                 # Express application setup
│   ├── server.ts             # Server initialization
│   ├── controllers/          # Request handlers
│   ├── middlewares/          # Authentication & validation
│   ├── routes/               # API route definitions
│   ├── lib/                  # Utility libraries
│   ├── seeder/              # Database seeding
│   └── test/                # Test files
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── migrations/          # Database migrations
│   └── PrismaClient.ts      # Prisma client setup
├── generated/
│   └── prisma/              # Generated Prisma client
└── dist/                    # Compiled JavaScript output
```

### Application Flow
```
Client Request → CORS → Authentication → Route Handler → 
    ├─ Database Operations (Prisma)
    ├─ External Service Calls
    └─ Response Formatting → Client Response
```

---

## Core Features

### 1. User Authentication & Authorization
**Primary Security Layer**
- JWT-based session management via Better-Auth
- Email verification workflow
- Role-based access control (client/advocate)
- Password security with industry standards
- Session persistence and refresh tokens

### 2. Advocate Verification System
**Trust-Building Infrastructure**
- Document upload and verification
- Registration number validation
- Professional credential verification
- Multi-step verification process
- Report system for misconduct

### 3. Appointment Management
**Core Service Feature**
- Google Calendar integration
- Real-time availability checking
- Automated appointment scheduling
- Email notifications and reminders
- Payment integration support

### 4. Social Platform Features
**Community Engagement**
- Legal discussion posts
- Reaction system (like, love, celebrate, insightful)
- Comment threads
- Content categorization by legal specialization
- Search and filtering capabilities

### 5. Data Management & Analytics
**Platform Intelligence**
- Comprehensive user analytics
- Advocate performance metrics
- Platform usage statistics
- Search optimization
- Content moderation

---

## API Documentation

### Base Configuration
```javascript
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LegalLink API",
      version: "1.0.0",
    },
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "better-auth.session_token",
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};
```

### API Endpoints Overview

#### Authentication Endpoints (`/api/auth/*`)
- `POST /api/auth/sign-up/email` - User registration
- `POST /api/auth/sign-in/email` - User login
- `POST /api/auth/update-user` - Profile updates
- `GET /api/auth/profile` - User profile retrieval
- All better-auth endpoints via wildcard handler

#### Advocate Management (`/api/advocate/*`)
- `POST /api/advocate/register` - Advocate registration
- `GET /api/advocate/me` - Current advocate profile
- `PUT /api/advocate/update` - Profile updates
- `POST /api/advocate/add-specialization` - Add specialization
- `GET /api/advocate/specializations` - List specializations
- `POST /api/advocate/verify` - Verification request
- `POST /api/advocate/add-case` - Add case history
- `PATCH /api/advocate/update-case/:case_id` - Update case
- `GET /api/advocate/cases/:advocate_id` - List cases

#### Search & Discovery (`/api/search/*`)
- `POST /api/search/advocate` - Advanced advocate search

#### Social Features (`/api/social/*`)
- `GET /api/social/post/all` - List all posts
- `POST /api/social/post/create` - Create new post
- `POST /api/social/post/edit` - Edit existing post
- `DELETE /api/social/post/:post_id` - Delete post
- `GET /api/social/post/:post_id` - Get single post
- `POST /api/social/post/react` - React to post
- `POST /api/social/post/comment` - Add comment
- `GET /api/social/post/:post_id/comments` - List comments
- `GET /api/social/post/:post_id/reactions` - List reactions

#### Appointment System (`/api/appointment/*`)
- `GET /api/appointment/advocate/calendar/connect` - Google Calendar OAuth
- `GET /api/appointment/advocate/calendar/callback` - OAuth callback
- `GET /api/appointment/advocate/availability/:advocate_id` - Check availability
- `POST /api/appointment/book` - Book appointment
- `POST /api/appointment/cancel` - Cancel appointment
- `POST /api/appointment/advocate/confirm` - Confirm appointment
- `GET /api/appointment/advocate/calendar` - List advocate appointments

#### Common Operations (`/api/*`)
- `GET /api/get-advocate/:advocate_id` - Get advocate details
- `GET /api/get-rating/:advocate_id` - Get advocate ratings
- `POST /api/add-rating/:advocate_id` - Add advocate rating
- `POST /api/advocate/report` - Report advocate
- `POST /api/upload` - File upload to Cloudinary

### Request/Response Examples

#### User Registration
```typescript
// POST /api/auth/sign-up/email
{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "SecurePass123",
  "userType": "client" | "advocate"
}

// Response
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "userType": "client"
  },
  "token": { /* auth token object */ }
}
```

#### Advocate Search
```typescript
// POST /api/search/advocate
{
  "location_city": "Mumbai",
  "specialization": "CRIMINAL",
  "availability_status": true,
  "language_preferences": ["English", "Hindi"],
  "experience_level": "Senior",
  "max_fee": 5000,
  "sort_by": "rating",
  "sort_order": "desc"
}

// Response
{
  "advocates": [
    {
      "advocate_id": "uuid",
      "user": {
        "name": "Advocate Name",
        "image": "profile_url"
      },
      "specializations": ["CRIMINAL"],
      "rating": 4.5,
      "experience_years": "10+",
      "fee_structure": {
        "Consultation": 2000
      }
    }
  ]
}
```

---

## Database Schema

### User Management
```sql
-- Users table (Better-Auth managed)
model User {
  id            String   @id
  name          String
  email         String   @unique
  emailVerified Boolean
  image         String?
  userType      String?  @default("client")
  city          String?
  district      String?
  state         String?
  location      String?
  // Relations
  advocates     advocates?
  appointments  appointments[]
  post_reactions post_reactions[]
  post_comments  post_comments[]
}
```

### Advocate System
```sql
-- Advocates table
model advocates {
  advocate_id               String   @id @default(uuid())
  registration_number       String
  reference_number          String
  verification_document_url String
  contact_email             String?
  phone_number              String?
  qualification             String?
  experience_years          String?
  availability_status       Boolean? @default(true)
  language_preferences      String[] @default([])
  location_city             String?
  jurisdiction_states       String[] @default([])
  is_verified               Boolean  @default(false)
  verification_status       String   @default("pending")
  fee_structure             Json?
  working_hours             Int[]    @default([10, 17])
  working_days              String[] @default(["MON", "TUE", "WED", "THU", "FRI"])
  userId                    String   @unique
  
  // Relations
  specializations   advocate_specializations[]
  ratings          advocate_ratings[]
  advocate_cases   advocate_cases[]
  advocate_posts   advocate_posts[]
  appointments     appointments[]
}

-- Specializations
enum Specialization {
  CRIMINAL
  CIVIL
  CORPORATE
  FAMILY
  CYBER
  INTELLECTUAL_PROPERTY
  TAXATION
  LABOR
  ENVIRONMENT
  HUMAN_RIGHTS
  // ... more specializations
}
```

### Social Platform
```sql
-- Posts
model advocate_posts {
  post_id     String         @id @default(uuid())
  advocate_id String
  text        String
  image_url   String?
  category    Specialization @default(OTHER)
  created_at  DateTime       @default(now())
  
  // Relations
  reactions   post_reactions[]
  comments    post_comments[]
}

-- Reactions
model post_reactions {
  id         String   @id @default(uuid())
  post_id    String
  user_id    String
  type       String   // "like", "love", "celebrate", "insightful"
  created_at DateTime @default(now())
  
  @@unique([post_id, user_id])
}
```

### Appointment System
```sql
model appointments {
  id                String   @id @default(uuid())
  advocate_id       String
  client_id         String
  appointment_time  DateTime
  duration_mins     Int      @default(60)
  reason            String
  is_confirmed      Boolean  @default(false)
  meeting_link      String?
  status            String   @default("pending")
  calendar_event_id String?
  created_at        DateTime @default(now())
}
```

---

## Authentication & Security

### Better-Auth Configuration
```typescript
export const auth = betterAuth({
  trustedOrigins: [process.env.CORS_ORIGIN || "http://localhost:3000"],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        html: `Click the link to verify your email: <a href="${url}">Verify Email</a>`
      });
    },
  },
});
```

### Security Features
- **Session Management**: Secure cookie-based sessions
- **CORS Protection**: Configurable origin restrictions
- **Input Validation**: Request body validation
- **SQL Injection Prevention**: Prisma ORM parameterized queries
- **XSS Protection**: Input sanitization
- **Rate Limiting**: API endpoint protection
- **Data Encryption**: TLS 1.3 for data in transit

### Role-Based Access Control
```typescript
// User Types
type UserType = "client" | "advocate";

// Middleware Chain
router.use(getUser);           // Authenticate user
router.use(getAdvocate);       // Verify advocate registration
router.use(isAdvocateVerified); // Check verification status
```

---

## Middleware System

### Authentication Middleware (`getUser`)
```typescript
export const getUser = async (req: any, res: any, next: any) => {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.locals.user = session?.user || null;
  next();
};
```

### Advocate Verification (`getAdvocate`, `isAdvocate`)
```typescript
export const getAdvocate = async (req, res, next) => {
  const user = res.locals.user;
  const result = await prisma.advocates.findUnique({
    where: { userId: user.id },
  });

  if (!result) {
    return res.status(403).json({
      error: "You are not registered as an advocate. Please register first.",
    });
  }

  res.locals.advocate = result;
  next();
};

export const isAdvocate = (req, res, next) => {
  const advocate = res.locals.advocate;
  
  if (!advocate.is_verified) {
    return res.status(403).json({
      error: "You are not verified as an advocate. Please complete verification.",
    });
  }
  
  next();
};
```

### Global Middleware Chain
```typescript
app.use(cookieParser());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
}));
app.use(logger("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));
```

---

## Route Structure

### Route Organization
```typescript
// app.ts route mounting
app.use(authRouter);                    // Better-Auth integration
app.use("/api", commonRouter);          // Common operations
app.use("/api/upload", uploadRouter);   // File upload
app.use("/api/appointment", appointmentRouter); // Appointments
app.use("/api/advocate", advocateRouter);        // Advocate management
app.use("/api/search", searchRouter);            // Search functionality
app.use("/api/social", socialRouter);            // Social features
app.use("/api", ratingRouter);                   // Rating system
```

### Route Patterns

#### Protected Routes
```typescript
// Requires authentication
router.use(getUser);

// Requires advocate registration
router.use(getAdvocate);

// Requires advocate verification
router.use(isAdvocateVerified);
```

#### Public Routes
```typescript
// Public advocate search
router.post("/search/advocate", async (req, res) => {
  // No authentication required
});

// Public advocate profiles
router.get("/get-advocate/:advocate_id", async (req, res) => {
  // Public advocate information
});
```

---

## Service Integration

### Google Calendar Integration
```typescript
// lib/google-calendar.ts
export const getAuthUrl = async (): Promise<string> => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
  });
  return authUrl;
};

export const createAppointmentEvent = async (
  accessToken: string,
  eventDetails: EventDetails
) => {
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const event = {
    summary: eventDetails.summary,
    description: eventDetails.description,
    start: { dateTime: eventDetails.startTime, timeZone: 'Asia/Kolkata' },
    end: { dateTime: eventDetails.endTime, timeZone: 'Asia/Kolkata' },
    attendees: [{ email: eventDetails.attendeeEmail }],
    conferenceData: {
      createRequest: { requestId: "sample123" }
    }
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
    conferenceDataVersion: 1,
  });

  return response.data;
};
```

### Cloudinary File Upload
```typescript
// lib/cloudinary.ts
export const uploadToCloudinary = async (fileBuffer: Buffer, options: UploadOptions) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "legallink",
        ...options
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(fileBuffer);
  });
};
```

### Email Service Integration
```typescript
// lib/resend.ts
export const sendEmail = async (emailData: EmailData) => {
  const { data, error } = await resend.emails.send({
    from: 'LegalLink <noreply@legallink.app>',
    to: emailData.to,
    subject: emailData.subject,
    html: emailData.html,
  });

  if (error) {
    throw new Error(`Email sending failed: ${error.message}`);
  }

  return data;
};
```

---

## Deployment and Setup

### Environment Variables
```env
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/legallink"

# Authentication
BETTER_AUTH_SECRET="your-secret-key"
CORS_ORIGIN="https://your-frontend-domain.com"

# External Services
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Google Calendar
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/appointment/advocate/calendar/callback"

# Email Service
RESEND_API_KEY="your-resend-api-key"

# Server Configuration
PORT=3000
NODE_ENV="development"
```

### Development Setup

1. **Install Dependencies**:
```bash
cd backend
npm install
```

2. **Database Setup**:
```bash
# Generate Prisma client
npm run generate:client

# Run migrations
npm run make:migrations init
npm run apply:migrations
```

3. **Start Development Server**:
```bash
npm run dev
```

4. **Access API Documentation**:
```
http://localhost:3000/api-docs
```

### Production Deployment

1. **Build Application**:
```bash
npm run build
```

2. **Database Migration**:
```bash
npm run apply:migrations
```

3. **Start Production Server**:
```bash
npm start
```

### Docker Configuration
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

---

## Development Guidelines

### Code Structure Standards

#### Controller Pattern
```typescript
// controllers/advocateController.ts
export const createAdvocate = async (req: Request, res: Response) => {
  try {
    const { registration_number, reference_number, verification_document_url } = req.body;
    
    // Validation
    if (!registration_number || !reference_number || !verification_document_url) {
      return res.status(400).json({
        error: "All registration fields are required"
      });
    }

    // Business logic
    const advocate = await prisma.advocates.create({
      data: {
        registration_number,
        reference_number,
        verification_document_url,
        user: { connect: { id: res.locals.user.id } }
      }
    });

    // Response
    res.status(201).json({ status: true, data: advocate });
  } catch (error) {
    console.error('Advocate creation error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};
```

#### Error Handling
```typescript
// Global error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message });
  }
  
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized access' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});
```

#### API Response Standards
```typescript
// Success Response
{
  "status": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully"
}

// Error Response
{
  "error": "Error description",
  "details": "Additional error details",
  "code": "ERROR_CODE"
}
```

### Database Best Practices

#### Query Optimization
```typescript
// Include only necessary fields
const advocates = await prisma.advocates.findMany({
  select: {
    advocate_id: true,
    user: {
      select: {
        name: true,
        image: true
      }
    },
    specializations: {
      select: {
        specialization: true
      }
    }
  },
  where: {
    is_verified: true,
    availability_status: true
  }
});
```

#### Transaction Management
```typescript
// Use transactions for related operations
const result = await prisma.$transaction(async (tx) => {
  const advocate = await tx.advocates.create({
    data: advocateData
  });
  
  await tx.advocate_specializations.createMany({
    data: specializations.map(spec => ({
      advocate_id: advocate.advocate_id,
      specialization: spec
    }))
  });
  
  return advocate;
});
```

### Testing Strategy

#### Unit Testing
```typescript
// tests/advocate.test.ts
describe('Advocate Registration', () => {
  test('should create advocate with valid data', async () => {
    const advocateData = {
      registration_number: 'REG123',
      reference_number: 'REF456',
      verification_document_url: 'https://example.com/doc.pdf'
    };

    const response = await request(app)
      .post('/api/advocate/register')
      .set('Cookie', authCookie)
      .send(advocateData)
      .expect(201);

    expect(response.body.status).toBe(true);
  });
});
```

#### Integration Testing
```typescript
// Test complete user journey
describe('Appointment Booking Flow', () => {
  test('should complete full booking process', async () => {
    // 1. Create client and advocate
    // 2. Verify advocate
    // 3. Check availability
    // 4. Book appointment
    // 5. Confirm appointment
  });
});
```

### Security Guidelines

#### Input Validation
```typescript
// Use validation middleware
const validateAdvocateRegistration = (req: Request, res: Response, next: NextFunction) => {
  const { registration_number, reference_number } = req.body;
  
  if (!registration_number?.match(/^[A-Z0-9]{6,20}$/)) {
    return res.status(400).json({
      error: "Invalid registration number format"
    });
  }
  
  next();
};
```

#### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api', apiLimiter);
```

### Performance Optimization

#### Database Indexing
```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_advocates_verification ON advocates(is_verified);
CREATE INDEX idx_advocates_location ON advocates(location_city);
CREATE INDEX idx_posts_category ON advocate_posts(category);
CREATE INDEX idx_appointments_time ON appointments(appointment_time);
```

#### Caching Strategy
```typescript
// Redis caching for frequent queries
const getCachedAdvocates = async (filters: SearchFilters) => {
  const cacheKey = `advocates:${JSON.stringify(filters)}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const advocates = await searchAdvocates(filters);
  await redis.setex(cacheKey, 300, JSON.stringify(advocates)); // 5 min cache
  
  return advocates;
};
```

---

## API Testing and Documentation

### Swagger Configuration
The API documentation is automatically generated using Swagger JSDoc and available at `/api-docs`. Each endpoint includes:

- **Request/Response schemas**
- **Authentication requirements**
- **Parameter descriptions**
- **Error codes and messages**
- **Example requests and responses**

### Testing Tools
- **Development**: Thunder Client, Postman
- **Automated**: Jest with Supertest
- **Load Testing**: Artillery, K6
- **API Monitoring**: Uptime monitoring services

### Example Test Cases
```typescript
// API endpoint testing
describe('POST /api/social/post/create', () => {
  it('should create post with valid data', async () => {
    const postData = {
      text: 'Legal advice on contract disputes',
      category: 'CIVIL',
      image_url: 'https://example.com/image.jpg'
    };

    const response = await request(app)
      .post('/api/social/post/create')
      .set('Cookie', advocateCookie)
      .send(postData)
      .expect(201);

    expect(response.body.status).toBe(true);
    expect(response.body.data.post_id).toBeDefined();
  });
});
```

---

## Future Enhancements

### Planned Features
1. **Advanced Analytics**
   - User behavior tracking
   - Performance metrics dashboard
   - Business intelligence reports

2. **Enhanced Security**
   - OAuth2 integration (Google, LinkedIn)
   - Multi-factor authentication
   - Advanced rate limiting

3. **Scalability Improvements**
   - Microservices architecture
   - Message queue integration (Redis/RabbitMQ)
   - Database sharding strategies

4. **AI Integration Expansion**
   - Document analysis API
   - Legal precedent search
   - Automated case categorization

### Technical Debt
1. **Code Quality**
   - Increase test coverage to 90%+
   - Implement comprehensive logging
   - Add API versioning

2. **Performance**
   - Database query optimization
   - Implement caching layers
   - CDN integration for file uploads

3. **Monitoring**
   - Application performance monitoring
   - Error tracking and alerting
   - Health check endpoints

---

## Support and Maintenance

### Monitoring and Logging
```typescript
// Application logging
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Health Check Endpoints
```typescript
// Health check route
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check external services
    const services = {
      database: 'healthy',
      redis: await checkRedisHealth(),
      email: await checkEmailService()
    };
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

### Backup and Recovery
- **Database Backups**: Automated daily backups with 30-day retention
- **File Storage**: Cloudinary automatic backup and CDN distribution
- **Configuration**: Environment-based configuration management
- **Disaster Recovery**: Multi-region deployment capabilities

---

## Conclusion

The LegalLink Backend provides a robust, scalable foundation for the legal services platform. With comprehensive API coverage, strong security measures, and extensible architecture, it supports the rapid development needs of the hackathon while maintaining production-ready standards.

The modular design allows for easy feature additions and modifications, making it suitable for both MVP development and future enterprise scaling. The comprehensive documentation and testing strategies ensure maintainability and reliability throughout the development lifecycle.

---

**LegalLink Backend** - *Powering accessible legal services with robust, secure, and scalable API infrastructure*

*Built with ❤️ for legal accessibility and powered by modern backend technologies*
