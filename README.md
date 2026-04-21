# TypeAworld - Private Company Portal

A complete, production-ready web application for a private company called "TypeAworld". Built with React, Vite, Tailwind CSS, and Firebase backend (Firestore, Authentication, Storage).

## Features

- **Secure Authentication**: Email/password login with 11 pre-approved email addresses only
- **Role-Based Access Control**: Admin, Secretary, and Member roles with different permissions
- **Dashboard**: Welcome message with role display and weekly meeting reminder
- **Company Profile**: Company history, objectives, and acts & articles with download functionality
- **Members Management**: View all members with charts, add/edit/delete members (Admin only)
- **Meeting Minutes**: Post and view meeting minutes with PDF download (Secretary/Admin)
- **Projects & Ideas**: Track projects with status (Success/Failed/In Progress) and download reports
- **Attendance System**: Mark attendance, submit apologies, view history
- **Admin Portal**: Manage members, allowed emails, and delete content
- **Download Functionality**: All posts can be downloaded as PDF files
- **Mobile Responsive**: Fully responsive design using Tailwind CSS
- **Secure Firestore**: Role-based security rules for data protection

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Google account for Firebase

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "typeaworld")
4. Follow the setup wizard (you can disable Google Analytics for this project)
5. Click "Create project"

### 2. Enable Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click **Get Started**
3. Select **Email/Password** sign-in provider
4. Enable it and click **Save**

### 3. Create Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click **Create database**
3. Select a location (choose closest to your users)
4. Start in **Test mode** (we'll update security rules later)
5. Click **Enable**

### 4. Enable Storage (Optional)

1. In Firebase Console, go to **Build** → **Storage**
2. Click **Get Started**
3. Follow the setup wizard
4. Start in **Test mode**

### 5. Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`)
4. Register your app (name it "TypeAworld")
5. Copy the firebaseConfig object

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

Open `src/firebase/config.js` and replace the placeholder values with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Add the 11 Approved Emails

In `src/firebase/config.js`, update the `ALLOWED_EMAILS` array with your 11 specific email addresses:

```javascript
export const ALLOWED_EMAILS = [
  'admin@typeaworld.com',
  'secretary@typeaworld.com',
  'member1@typeaworld.com',
  'member2@typeaworld.com',
  'member3@typeaworld.com',
  'member4@typeaworld.com',
  'member5@typeaworld.com',
  'member6@typeaworld.com',
  'member7@typeaworld.com',
  'member8@typeaworld.com',
  'member9@typeaworld.com'
  // Replace with your actual 11 emails
];
```

### 4. Create Users in Firebase Authentication

1. Go to Firebase Console → **Authentication** → **Users** tab
2. Click **Add user**
3. Enter each of the 11 email addresses
4. Set a password for each user
5. Click **Add user**
6. Repeat for all 11 users

### 5. Set User Roles

After creating users, you need to set their roles in Firestore. You can do this via Firebase Console:

1. Go to **Firestore Database**
2. Create a collection named `users`
3. For each user, create a document with their Firebase UID as the document ID:
   - **Document ID**: The user's Firebase UID (from Authentication tab)
   - **Fields**:
     - `email`: (string) User's email
     - `role`: (string) "Admin", "Secretary", or "Member"
     - `lastLogin`: (timestamp) Current timestamp

**Example for Admin user:**
- Document ID: `abc123xyz...` (Firebase UID)
- email: "admin@typeaworld.com"
- role: "Admin"
- lastLogin: [current timestamp]

**Important**: You must have at least one Admin user to access the Admin Portal.

## Deploy Firestore Security Rules

### Option 1: Via Firebase Console

1. Go to Firebase Console → **Firestore Database** → **Rules** tab
2. Delete the existing rules
3. Copy the contents of `firestore.rules` file from this project
4. Paste into the rules editor
5. Click **Publish**

### Option 2: Via Firebase CLI (Recommended for production)

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in your project:
```bash
firebase init
```
- Select "Firestore"
- Select "Use an existing project"
- Choose your TypeAworld project
- Select "firestore.rules" file (already exists)
- Skip indexes for now

4. Deploy rules:
```bash
firebase deploy --only firestore:rules
```

## Running the Project

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Deployment

### Option 1: Firebase Hosting

1. Initialize Firebase Hosting:
```bash
firebase init hosting
```
- Select "Use an existing project"
- Choose your TypeAworld project
- Public directory: `dist`
- Configure as single-page app: Yes
- Set up automatic builds: No

2. Build the project:
```bash
npm run build
```

3. Deploy:
```bash
firebase deploy
```

### Option 2: Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

Follow the prompts to deploy your project.

### Option 3: Netlify

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to Netlify via their dashboard or CLI.

## Project Structure

```
TypeAworld/
├── public/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx          # Navigation bar with role-based links
│   │   └── ProtectedRoute.jsx  # Route protection component
│   ├── context/
│   │   └── AuthContext.jsx     # Authentication context provider
│   ├── firebase/
│   │   ├── auth.js             # Authentication functions
│   │   ├── config.js           # Firebase configuration & email allowlist
│   │   └── firestore.js        # Firestore CRUD operations
│   ├── pages/
│   │   ├── AdminPortal.jsx     # Admin-only management interface
│   │   ├── Attendance.jsx      # Attendance & apologies tracking
│   │   ├── CompanyProfile.jsx  # Company history, objects, acts
│   │   ├── Dashboard.jsx       # Main dashboard
│   │   ├── Login.jsx           # Login page
│   │   ├── Members.jsx         # Members list with charts
│   │   ├── Minutes.jsx         # Meeting minutes
│   │   └── Projects.jsx        # Projects & ideas
│   ├── App.jsx                 # Main app with routing
│   ├── index.css               # Global styles with Tailwind
│   └── main.jsx                # Entry point
├── firestore.rules             # Firestore security rules
├── index.html                  # HTML template
├── package.json                # Dependencies
├── tailwind.config.js          # Tailwind configuration
├── vite.config.js              # Vite configuration
└── README.md                   # This file
```

## User Roles & Permissions

### Admin
- Access all features
- Add/edit/delete members
- Manage allowed email list
- Delete any content (minutes, projects, apologies)
- View all attendance records
- Access Admin Portal

### Secretary
- Post and edit meeting minutes
- Delete minutes
- View all attendance records
- Add projects
- Cannot access Admin Portal

### Member
- View all content
- Add projects
- Mark own attendance
- Submit apologies
- Cannot delete content (except own projects)
- Cannot access Admin Portal

## Features in Detail

### 1. Login Page
- Email/password authentication
- Only pre-approved emails can log in
- Redirects to dashboard on successful login

### 2. Dashboard
- Welcome message with user's role
- Persistent weekly meeting reminder (Friday at 4 PM)
- Quick links to all major sections
- Statistics overview

### 3. Company Profile
- Company history (exact text as specified)
- 6 company objectives
- Company acts & articles with download
- All content downloadable as PDF

### 4. Members Section
- List of all 11 members with details
- Bar chart and pie chart showing members by position
- Tags for each member (#Founder, #Secretary, etc.)
- Admin can add/edit/delete members
- Download full members list as PDF

### 5. Minutes Section
- Secretary/Admin can post minutes
- All members can view minutes
- Each minute has a download button (PDF)
- Timestamp and author information

### 6. Projects & Ideas
- All members can post project ideas
- Track project status (Success/Failed/In Progress)
- Color-coded status indicators
- Add project reports with lessons learned
- Download full project details as PDF

### 7. Attendance & Apologies
- Members can mark daily attendance (Present/Absent)
- If absent, submit apology with reason
- Admin/Secretary can view full history
- Download attendance report as PDF

### 8. Admin Portal
- Manage members (add/edit/delete)
- Manage allowed email list
- Bulk delete content (minutes, projects, apologies)
- View all system data

## Security Features

- Email allowlist in code (`ALLOWED_EMAILS` array)
- Firestore security rules with role-based access
- Protected routes requiring authentication
- Role-based UI elements
- Secure password storage via Firebase Auth

## Troubleshooting

### "Email not authorized" error
- Ensure the email is in the `ALLOWED_EMAILS` array in `src/firebase/config.js`
- After updating the array, restart the development server

### "Permission denied" errors
- Check that Firestore security rules are deployed
- Verify user roles are set correctly in Firestore `users` collection
- Ensure the user is authenticated

### Charts not displaying
- Ensure `recharts` package is installed
- Check browser console for errors
- Verify members data exists in Firestore

### Download not working
- Ensure `jspdf` package is installed
- Check browser popup blocker settings
- Verify content exists before downloading

### Cannot access Admin Portal
- Verify user role is set to "Admin" in Firestore
- Check the `users` collection in Firestore Database
- Ensure the user's Firebase UID matches the document ID

## Initial Data Setup

After deployment, you'll need to:

1. **Add the first Admin user** via Firebase Console:
   - Go to Authentication → Add user
   - Create admin account
   - Go to Firestore → users collection
   - Add document with user's UID, email, and role: "Admin"

2. **Add members** via the Admin Portal:
   - Log in as Admin
   - Go to Admin Portal → Manage Members
   - Add all 11 members with their details

3. **Add company acts** via Firebase Console (optional):
   - Go to Firestore → acts collection
   - Add documents with title and content fields

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review Firebase Console for errors
3. Check browser console for client-side errors
4. Verify all configuration steps are complete

## License

This is a private company portal. All rights reserved.

## Technologies Used

- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Firebase** - Backend (Auth, Firestore, Storage)
- **React Router** - Navigation
- **Recharts** - Charts visualization
- **jsPDF** - PDF generation
- **Lucide React** - Icons
- **date-fns** - Date formatting
