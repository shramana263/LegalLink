# LegalLink Frontend Documentation
## Software Requirements Specification - Hackathon Version

### Executive Summary

This Software Requirements Specification outlines the frontend development of LegalLink Hackathon Version, a streamlined legal services platform designed for rapid prototype development within hackathon constraints. The platform focuses on five core features with the AI-powered legal query assistant serving as the primary value proposition, supported by essential trust-building and community engagement capabilities.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [Core Features](#core-features)
5. [Component Documentation](#component-documentation)
6. [Context Providers](#context-providers)
7. [Hooks and Utilities](#hooks-and-utilities)
8. [UI Components](#ui-components)
9. [API Integration](#api-integration)
10. [Deployment and Setup](#deployment-and-setup)
11. [Development Guidelines](#development-guidelines)

---

## Project Overview

LegalLink is a modern legal services platform that connects users with legal advocates while providing AI-powered assistance for legal queries. The frontend is built with Next.js 14 using TypeScript and provides a responsive, multilingual interface for both clients and legal advocates.

### Key Objectives
- Provide AI-powered legal query assistance
- Enable secure user-advocate communication
- Support appointment scheduling and management
- Create a social feed for legal discussions
- Implement multilingual support for accessibility

---

## Technology Stack

### Core Technologies
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: React Context API + Jotai
- **HTTP Client**: Axios
- **Maps Integration**: Ola Maps
- **Translation**: Google Translate API

### Development Tools
- **Package Manager**: pnpm
- **Build Tool**: Next.js built-in
- **Linting**: ESLint
- **Type Checking**: TypeScript

---

## Architecture Overview

```
frontend/
├── app/                    # Next.js App Router pages
├── components/             # Reusable React components
├── contexts/              # React Context providers
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries and configurations
├── public/                # Static assets
├── styles/                # Global styles
└── types/                 # TypeScript type definitions
```

### App Router Structure
```
app/
├── globals.css           # Global styles
├── layout.tsx           # Root layout component
├── loading.tsx          # Global loading component
├── page.tsx             # Home page
├── advocates/           # Advocate-related pages
├── appointments/        # Appointment management
├── chatbot/            # AI chatbot interface
├── feed/               # Social feed
├── login/              # Authentication
├── messages/           # Direct messaging
├── notifications/      # User notifications
├── profile/           # User profile management
└── signup/            # User registration
```

---

## Core Features

### 1. AI-Powered Legal Assistant
**Primary Value Proposition**
- Real-time legal query processing
- WebSocket-based communication
- Multi-language support
- Quick action suggestions
- Document analysis capabilities

### 2. User-Advocate Matching
**Trust-Building Feature**
- Advocate profile browsing
- Rating and review system
- Specialization filtering
- Geographic location matching
- Direct messaging capabilities

### 3. Appointment Scheduling
**Core Service Feature**
- Calendar integration
- Time slot management
- Automated reminders
- Video consultation support
- Payment integration

### 4. Legal Community Feed
**Engagement Feature**
- Knowledge sharing posts
- Case discussions
- Legal news updates
- Reaction system (like, love, celebrate, insightful)
- Comment threads

### 5. Multilingual Support
**Accessibility Feature**
- Support for English, Hindi, Bengali, Urdu
- Real-time translation
- RTL text support for Arabic scripts
- Cultural adaptation

---

## Component Documentation

### Core Components

#### 1. ChatBot Component (`/components/ChatBot.tsx`)
**Purpose**: AI-powered legal assistant interface

**Features**:
- WebSocket-based real-time communication
- Message history management
- Typing indicators
- File upload support
- Quick action buttons

**Props**:
```typescript
interface ChatBotProps {
  userId?: string;
  initialMessage?: string;
  onMessageSent?: (message: string) => void;
}
```

**Usage**:
```tsx
<ChatBot 
  userId={user?.id} 
  initialMessage="How can I help you with your legal query?"
  onMessageSent={handleMessageSent}
/>
```

#### 2. Navbar Component (`/components/Navbar.tsx`)
**Purpose**: Main navigation and search interface

**Features**:
- User authentication status
- Global search with suggestions
- Theme toggle (dark/light)
- Language selection
- Mobile responsive menu
- Create post quick action

**State Management**:
```typescript
const [searchQuery, setSearchQuery] = useState("");
const [suggestions, setSuggestions] = useState<any[]>([]);
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
```

#### 3. FeedContent Component (`/components/FeedContent.tsx`)
**Purpose**: Social feed for legal discussions

**Features**:
- Post display with reactions
- Comment system
- Real-time updates
- Content filtering
- Infinite scrolling

**Reaction Types**:
```typescript
const REACTION_TYPES = [
  { type: "like", label: "Like", icon: <ThumbsUp /> },
  { type: "love", label: "Love", icon: "♥" },
  { type: "celebrate", label: "Celebrate", icon: "🎉" },
  { type: "insightful", label: "Insightful", icon: "💡" }
];
```

#### 4. CreatePostSection Component (`/components/CreatePostSection.tsx`)
**Purpose**: Content creation interface

**Features**:
- Rich text editing
- Image upload
- Category selection
- Draft saving
- Post scheduling

**Categories**:
- CRIMINAL
- CIVIL
- CORPORATE
- FAMILY
- CONSTITUTIONAL

#### 5. ProfileSidebar Component (`/components/ProfileSidebar.tsx`)
**Purpose**: User and advocate profile display

**Features**:
- User information display
- Advocate ratings and reviews
- Contact information
- Specialization tags
- Connection status

#### 6. DocumentViewer Component (`/components/DocumentViewer.tsx`)
**Purpose**: Document display and analysis

**Supported Formats**:
- PDF documents
- Images (JPG, PNG, WebP, SVG)
- Fallback link display

**Features**:
- Embedded PDF viewer
- Image gallery
- Download functionality
- Security controls

#### 7. OlaMap Component (`/components/OlaMap.tsx`)
**Purpose**: Location-based services

**Features**:
- Interactive map display
- Location selection
- Advocate proximity search
- Route planning
- Custom markers

**Configuration**:
```typescript
const OLA_MAP_STYLE = "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard-mr/style.json";
```

### Utility Components

#### LanguageDropdown (`/components/LanguageDropdown.tsx`)
- Language selection interface
- Real-time translation trigger
- Cultural flag display

#### NewsThread (`/components/NewsThread.tsx`)
- Legal news and updates
- Court hearing schedules
- Case status tracking

#### ReactionPopover (`/components/ReactionPopover.tsx`)
- Emoji reaction interface
- Reaction count display
- Hover interactions

---

## Context Providers

### 1. AuthContext (`/contexts/AuthContext.tsx`)
**Purpose**: User authentication and session management

**State**:
```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}
```

**Features**:
- JWT token management
- Persistent session storage
- Automatic token refresh
- Role-based access control

### 2. LanguageContext (`/contexts/LanguageContext.tsx`)
**Purpose**: Multilingual support and translation

**Supported Languages**:
```typescript
export const supportedLanguages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', direction: 'ltr' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', direction: 'ltr' },
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩', direction: 'ltr' },
  { code: 'ur', name: 'اردو', flag: '🇵🇰', direction: 'rtl' }
];
```

**Features**:
- Dynamic language switching
- RTL text support
- Translation status tracking
- Cultural adaptation

### 3. ThemeProvider (`/components/theme-provider.tsx`)
**Purpose**: Dark/light theme management

**Features**:
- System preference detection
- Manual theme toggle
- Persistent theme storage
- CSS variable management

---

## Hooks and Utilities

### Custom Hooks

#### 1. useWebSocket (`/hooks/useWebSocket.ts`)
**Purpose**: WebSocket connection management for real-time features

**Features**:
- Automatic reconnection
- Message queue management
- Connection status tracking
- Error handling

**Interface**:
```typescript
interface WebSocketHookReturn {
  messages: Message[];
  isConnected: boolean;
  isConnecting: boolean;
  sendMessage: (message: string) => void;
}
```

#### 2. useGoogleTranslate (`/hooks/useGoogleTranslate.ts`)
**Purpose**: Google Translate API integration

**Features**:
- Text translation
- Language detection
- Batch translation
- Cache management

#### 3. useIsMobile (`/hooks/use-mobile.tsx`)
**Purpose**: Responsive design utilities

**Features**:
- Breakpoint detection
- Dynamic responsive behavior
- Mobile-specific optimizations

### Utility Functions

#### 1. API Client (`/lib/axiosClient.ts`)
**Configuration**:
```typescript
const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
  withCredentials: true
});
```

#### 2. Location Services (`/lib/location.ts`)
**Features**:
- Geolocation API integration
- Address geocoding
- Distance calculations

#### 3. Utilities (`/lib/utils.ts`)
**Features**:
- CSS class merging
- WebSocket error handling
- Connection status management

---

## UI Components

The application uses a comprehensive design system built on Radix UI primitives and styled with Tailwind CSS.

### Core UI Components
- **Buttons**: Primary, secondary, ghost, destructive variants
- **Forms**: Input, textarea, select, checkbox, radio groups
- **Layout**: Card, separator, accordion, tabs
- **Navigation**: Dropdown menu, navigation menu, breadcrumb
- **Feedback**: Alert, toast, dialog, progress
- **Data Display**: Table, badge, avatar, skeleton

### Component Categories

#### Form Components
- `Input`: Text input with validation
- `Textarea`: Multi-line text input
- `Select`: Dropdown selection
- `Checkbox`: Boolean selection
- `RadioGroup`: Single selection from options

#### Layout Components
- `Card`: Content container
- `Separator`: Visual divider
- `Accordion`: Collapsible content
- `Tabs`: Content switching
- `Sidebar`: Navigation sidebar

#### Feedback Components
- `Alert`: Status messages
- `Toast`: Temporary notifications
- `Dialog`: Modal interactions
- `Progress`: Loading indicators

#### Navigation Components
- `DropdownMenu`: Contextual actions
- `NavigationMenu`: Main navigation
- `Breadcrumb`: Page hierarchy

---

## API Integration

### API Structure (`/lib/api.ts`)

```typescript
export const API = {
  Auth: AuthAPI,
  Advocate: AdvocateAPI,
  Upload: UploadAPI,
  Social: SocialAPI,
  Appointment: AppointmentAPI,
  AI: AiAPI
};
```

### API Endpoints

#### Authentication API
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user
- `PUT /auth/profile` - Update user profile

#### Advocate API
- `GET /advocates` - List advocates
- `GET /advocates/:id` - Get advocate details
- `POST /advocates/:id/rate` - Rate advocate
- `GET /advocates/search` - Search advocates

#### Social API
- `GET /posts` - Get feed posts
- `POST /posts` - Create new post
- `POST /posts/:id/react` - React to post
- `GET /posts/:id/comments` - Get post comments
- `POST /posts/:id/comments` - Add comment

#### Appointment API
- `GET /appointments` - Get user appointments
- `POST /appointments` - Schedule appointment
- `PUT /appointments/:id` - Update appointment
- `DELETE /appointments/:id` - Cancel appointment

#### AI API
- `POST /ai/query` - Send legal query
- `GET /ai/history` - Get chat history
- `POST /ai/analyze-document` - Document analysis

### WebSocket Endpoints
- `ws://api/chat` - Real-time chat
- `ws://api/notifications` - Live notifications
- `ws://api/status` - Connection status

---

## Deployment and Setup

### Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_FASTAPI_HOST_ADDRESS=http://localhost:8000

# Maps Integration
NEXT_PUBLIC_OLA_MAPS_API_KEY=your_ola_maps_key

# Google Services
NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY=your_google_translate_key

# WebSocket Configuration
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

### Development Setup

1. **Install Dependencies**:
```bash
cd frontend
pnpm install
```

2. **Start Development Server**:
```bash
pnpm dev
```

3. **Build for Production**:
```bash
pnpm build
pnpm start
```

### Production Deployment

1. **Build Optimization**:
```bash
pnpm build
```

2. **Environment Configuration**:
- Set production API URLs
- Configure CDN for static assets
- Enable performance monitoring

3. **Deployment Options**:
- Vercel (recommended for Next.js)
- AWS Amplify
- Docker containers
- Traditional hosting

---

## Development Guidelines

### Code Standards

#### TypeScript Usage
- Strict type checking enabled
- Interface definitions for all props
- Proper error handling with typed exceptions
- Generic types for reusable components

#### Component Structure
```typescript
// Component interface
interface ComponentProps {
  required: string;
  optional?: boolean;
}

// Component implementation
export default function Component({ required, optional = false }: ComponentProps) {
  // Hooks at the top
  const [state, setState] = useState<Type>(initialValue);
  
  // Event handlers
  const handleEvent = useCallback(() => {
    // Implementation
  }, [dependencies]);
  
  // Render
  return (
    <div className="component-styles">
      {/* JSX content */}
    </div>
  );
}
```

#### File Naming Conventions
- Components: PascalCase (`UserProfile.tsx`)
- Hooks: camelCase with `use` prefix (`useUserData.ts`)
- Utilities: camelCase (`apiClient.ts`)
- Types: PascalCase (`UserTypes.ts`)

### Performance Optimization

#### Code Splitting
```typescript
// Dynamic imports for heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false
});
```

#### Image Optimization
```typescript
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="Description"
  width={300}
  height={200}
  priority={false}
  placeholder="blur"
/>
```

#### Memoization
```typescript
// Expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// Callback optimization
const handleClick = useCallback((id: string) => {
  // Handler implementation
}, [dependency]);
```

### Testing Strategy

#### Unit Testing
- Component testing with React Testing Library
- Hook testing with `@testing-library/react-hooks`
- Utility function testing with Jest

#### Integration Testing
- API integration tests
- WebSocket connection tests
- Authentication flow tests

#### E2E Testing
- Critical user journeys
- Cross-browser compatibility
- Mobile responsiveness

### Accessibility Guidelines

#### ARIA Implementation
- Proper semantic HTML
- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility

#### Color and Contrast
- WCAG 2.1 AA compliance
- High contrast mode support
- Color-blind friendly palette

#### Responsive Design
- Mobile-first approach
- Touch-friendly interfaces
- Flexible layouts

---

## Future Enhancements

### Planned Features
1. **Advanced AI Integration**
   - Document analysis with OCR
   - Legal precedent search
   - Case outcome prediction

2. **Enhanced Communication**
   - Video conferencing integration
   - Voice message support
   - File sharing capabilities

3. **Mobile Applications**
   - React Native implementation
   - Push notifications
   - Offline functionality

4. **Analytics and Insights**
   - User behavior tracking
   - Performance monitoring
   - Business intelligence

### Technical Debt
1. **Performance Optimization**
   - Bundle size reduction
   - Image optimization
   - Caching strategies

2. **Code Quality**
   - Test coverage improvement
   - Code documentation
   - Type safety enhancement

3. **Security Enhancements**
   - Security audit
   - Data encryption
   - Access control refinement

---

## Support and Maintenance

### Documentation Updates
- Component API documentation
- Integration guides
- Troubleshooting guides

### Version Control
- Semantic versioning
- Change log maintenance
- Migration guides

### Monitoring
- Error tracking with Sentry
- Performance monitoring
- User analytics

---

*This documentation is maintained by the LegalLink development team and updated with each major release.*
