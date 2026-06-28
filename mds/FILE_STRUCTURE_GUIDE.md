# 📁 Pet Healthcare Platform - File Structure Guide

## Updated Files Structure

```
frontend/
├── app/
│   ├── auth/
│   │   ├── signup/
│   │   │   ├── page.tsx                 [UPDATED - Multi-step signup flow]
│   │   │   ├── clinic-form.tsx          [NEW - Clinic registration form]
│   │   │   └── verification-modal.tsx   [NEW - Post-signup modal]
│   │   ├── select-role/
│   │   │   └── page.tsx                 [UPDATED - Clinic role added]
│   │   └── login/
│   │       └── page.tsx
│   │
│   ├── clinic/                          [NEW - Clinic routes]
│   │   ├── layout.tsx                   [NEW - Clinic layout]
│   │   ├── dashboard/
│   │   │   └── page.tsx                 [NEW - Clinic dashboard]
│   │   ├── patients/
│   │   │   └── page.tsx                 [NEW - Clinic patients]
│   │   └── profile/
│   │       └── page.tsx                 [NEW - Clinic profile]
│   │
│   ├── admin/                           [NEW - Admin routes]
│   │   ├── layout.tsx                   [NEW - Admin layout]
│   │   ├── dashboard/
│   │   │   └── page.tsx                 [NEW - Admin dashboard]
│   │   └── clinics/
│   │       └── page.tsx                 [NEW - Clinic verification]
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx                   [Existing - Pet owner dashboard]
│   │   ├── dashboard/
│   │   │   └── page.tsx                 [Pet owner dashboard]
│   │   ├── my-pets/
│   │   │   └── page.tsx
│   │   ├── ai-assistant/
│   │   │   └── page.tsx
│   │   └── find-vets/
│   │       └── page.tsx                 [UPDATED - Find clinics]
│   │
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx                  [UPDATED - Clinic routes]
│   │   ├── TopNavbar.tsx
│   │   └── DashboardLayout.tsx
│   │
│   └── ui/
│       ├── NotificationDropdown.tsx
│       └── PetCard.tsx
│
└── contexts/
    ├── AuthContext.tsx                  [UPDATED - Role types]
    └── ThemeContext.tsx
```

## 🔑 Key Route Changes

### Pet Owner Routes (Unchanged)
```
/dashboard           - Pet owner dashboard
/my-pets            - Pet management
/find-vets          - Find clinics (updated UI)
/ai-assistant       - AI chat
```

### New Clinic Routes
```
/clinic/dashboard   - Clinic dashboard with verification status
/clinic/patients    - Clinic patients list
/clinic/profile     - Clinic profile management
```

### New Admin Routes
```
/admin/dashboard    - Admin overview and stats
/admin/clinics      - Clinic verification management
```

### Auth Routes
```
/auth/signup        - Multi-step signup (role selection + clinic form)
/auth/select-role   - Role selection (updated)
/auth/login         - User login
```

## 🔄 Data Flow

### Clinic Registration Flow
```
1. /auth/signup (Basic Info)
   ↓
2. Role Selection (Owner vs Clinic)
   ↓
3. If Clinic: /auth/signup (Clinic Form)
   - Clinic name, contact, address
   - Operating hours
   - Document uploads (license, photo)
   ↓
4. Verification Modal (Status: Pending)
   ↓
5. /clinic/dashboard (Limited Features)
   - Can view/edit profile
   - Cannot manage patients yet
   ↓
6. Admin Reviews (/admin/clinics)
   - Approve/Reject/Request Info
   ↓
7. If Approved → /clinic/dashboard (Full Features)
   - Manage patients
   - View statistics
   - Access all features
```

### Admin Verification Workflow
```
1. Admin Dashboard (/admin/dashboard)
   - View pending verification count
   - Quick action buttons
   
2. Clinic Verification (/admin/clinics)
   - Search/filter clinics
   - View clinic details modal
   - Download documents
   
3. Actions
   - Approve → Email sent, clinic gains access
   - Reject → Email sent with reason
   - Request Info → Email sent with required info
```

## 🎯 Component Hierarchy

### AuthContext Changes
```typescript
// Old
type Role = 'owner' | 'vet' | null;

// New
type Role = 'owner' | 'clinic' | 'admin' | null;

// User Interface Extended
interface User {
  clinicName?: string;           // [NEW]
  verificationStatus?: 'pending' | 'approved' | 'rejected';  // [NEW]
  submittedDate?: string;        // [NEW]
}
```

### Sidebar Route Logic
```typescript
// Old
const vetLinks = [
  { href: '/vet/dashboard', label: 'Dashboard' },
  { href: '/vet/patients', label: 'Patients' },
];
links = role === 'vet' ? vetLinks : ownerLinks;

// New
const clinicLinks = [
  { href: '/clinic/dashboard', label: 'Dashboard' },
  { href: '/clinic/patients', label: 'Clinic Patients' },
];
links = role === 'clinic' ? clinicLinks : ownerLinks;
```

## 📊 Feature Availability Matrix

| Feature | Owner | Clinic (Pending) | Clinic (Approved) | Admin |
|---------|-------|------------------|-------------------|-------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| My Pets / Patients | ✅ | ❌ | ✅ | - |
| Patient Management | ✅ | ❌ | ✅ | - |
| Profile View | ✅ | ✅ | ✅ | - |
| Profile Edit | ✅ | ✅ | ✅ | - |
| Upload Documents | ✅ | ✅ | ✅ | - |
| AI Assistant | ✅ | ❌ | ✅ | - |
| Find Clinics | ✅ | - | - | - |
| Clinic Verification | - | - | - | ✅ |
| View Reviews | ✅ | - | ✅ | - |

## 🎨 UI Status Badges

### Verification Status Colors
- **Pending**: Amber (#FBBF24) - ⏳ Under Review
- **Approved**: Green (#4ADE80) - ✅ Verified
- **Rejected**: Red (#F87171) - ❌ Not Approved
- **Open Now**: Green Pulse - 🟢 Currently Operating

### Visit Type Colors
- **Routine**: Green - Standard checkup
- **Walk-in**: Blue - Unscheduled visit
- **Emergency**: Red - Urgent care

## 🚀 Next Steps for Backend

To complete the system, implement:

1. **Clinic Registration API**
   - POST `/api/clinics/register`
   - File upload for documents
   - Verification status tracking

2. **Admin Verification API**
   - GET `/api/admin/clinics` (pending)
   - POST `/api/admin/clinics/{id}/approve`
   - POST `/api/admin/clinics/{id}/reject`
   - POST `/api/admin/clinics/{id}/request-info`

3. **Patient Management API**
   - GET `/api/clinic/patients`
   - POST `/api/clinic/patients`
   - Track visit types (walk-in, emergency)

4. **Email Notifications**
   - Verification approved/rejected
   - Request for additional info
   - Status update notifications

## 🔐 Security Checklist

- ✅ Role-based access control implemented
- ✅ Route protection with auth checks
- ✅ Verification status gating
- ✅ Document upload validation (file types)
- ✅ Admin-only access to verification panel
- ⚠️ TODO: Backend API authentication
- ⚠️ TODO: Rate limiting on uploads
- ⚠️ TODO: Document storage security
- ⚠️ TODO: Audit logging

