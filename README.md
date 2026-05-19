# PetPULSE Frontend - Next.js Application

A comprehensive pet health management platform built with Next.js, featuring role-based dashboards for pet owners and veterinarians.

## Migration from Vite to Next.js

### What Changed:

1. **Build Tool**: Migrated from Vite to Next.js (App Router)
2. **Routing**: React Router DOM → Next.js built-in file-based routing
3. **Components**: All components remain the same with updated imports
4. **Project Structure**:
   - `src/` → `app/` (Next.js App Router)
   - Components in `components/` directory
   - Contexts in `contexts/` directory
   - Pages follow Next.js file structure

### Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── (dashboard)/             # Route group for protected pages
│   │   ├── dashboard/           # /dashboard
│   │   ├── my-pets/             # /my-pets
│   │   ├── ai-assistant/        # /ai-assistant
│   │   ├── find-vets/           # /find-vets
│   │   ├── vet/                 # Vet pages
│   │   │   ├── dashboard/       # /vet/dashboard
│   │   │   ├── patients/        # /vet/patients
│   │   │   └── profile/         # /vet/profile
│   │   └── layout.tsx           # Dashboard layout with sidebar
│   ├── auth/                    # Authentication pages
│   │   ├── login/               # /auth/login
│   │   ├── signup/              # /auth/signup
│   │   └── select-role/         # /auth/select-role
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout with providers
│   └── page.tsx                 # Home page (redirects to login)
├── components/                  # Reusable components
│   ├── layout/                  # Layout components (Sidebar, TopNavbar)
│   └── ui/                      # UI components (PetCard, NotificationDropdown)
├── contexts/                    # Context providers
│   ├── AuthContext.tsx          # Authentication context
│   └── ThemeContext.tsx         # Theme context (light/dark)
├── middleware.ts                # Next.js middleware for route protection
├── next.config.ts               # Next.js configuration
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript configuration
├── tailwind.config.js           # Tailwind CSS configuration
└── README.md                    # This file
```

### Setup & Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run type checking
npm run type-check

# Run linting
npm run lint
```

### Development Server

The application runs on `http://localhost:3000` by default.

### Key Features

- **Role-based Access**: Pet Owner and Veterinarian roles
- **Dashboard**: Personalized dashboards for each role
- **Pet Management**: Add, view, and manage pet profiles
- **AI Health Assistant**: AI-powered health check recommendations
- **Vet Discovery**: Find and connect with veterinarians
- **Dark/Light Theme**: Full dark mode support
- **Responsive Design**: Mobile-first, fully responsive UI
- **Real-time Notifications**: Pet health and appointment notifications

### Authentication Flow

1. **Login Page** (`/auth/login`) - Sign in with email/password
2. **Signup Page** (`/auth/signup`) - Create new account
3. **Role Selection** (`/auth/select-role`) - Choose Pet Owner or Veterinarian
4. **Protected Routes** - Access dashboard after authentication

### Pages Overview

#### Pet Owner Routes
- `/dashboard` - Main dashboard with pet overview
- `/my-pets` - Manage pet profiles
- `/ai-assistant` - AI health check assistant
- `/find-vets` - Search and discover vets

#### Veterinarian Routes
- `/vet/dashboard` - Clinic overview and patient cases
- `/vet/patients` - Patient management (coming soon)
- `/vet/profile` - Vet profile settings (coming soon)

### Technologies Used

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React Icons
- **Animations**: Framer Motion
- **State Management**: React Context API

### Next.js Features Utilized

- ✅ App Router for file-based routing
- ✅ Server Components (default)
- ✅ Client Components (`'use client'`)
- ✅ Middleware for route protection
- ✅ Image optimization
- ✅ Built-in ESLint configuration

### Important Notes

- **Client Components**: Pages and components using hooks are marked with `'use client'`
- **Contexts**: Auth and Theme contexts are client components to support state management
- **Environment Variables**: Add API endpoints in `.env.local`
- **Dark Mode**: Uses `dark:` Tailwind classes with localStorage persistence

### Future Improvements

1. Implement actual authentication with backend API
2. Add database integration for pet and vet data
3. Implement real-time notifications
4. Add appointment scheduling
5. Implement payment processing
6. Add pet medical records upload/download
7. Create admin dashboard

### Troubleshooting

#### Port 3000 already in use
```bash
npm run dev -- -p 3001
```

#### Clear Next.js cache
```bash
rm -rf .next
npm run dev
```

#### TypeScript errors
```bash
npm run type-check
```

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Docker
```bash
docker build -t petpulse-frontend .
docker run -p 3000:3000 petpulse-frontend
```

### Manual Deployment
```bash
npm run build
npm start
```

## License

All rights reserved © 2024 PetPULSE

## Support

For issues or questions, please contact the development team.
