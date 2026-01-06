# 💌 Letter Maker

A beautiful Next.js application for creating and sharing digital foldable letters with a nostalgic touch.

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.18-38bdf8)

## ✨ Features

- 📝 Create beautiful digital letters with custom fonts and images
- 🎨 Interactive 3D folding animation with Framer Motion
- 🔐 Firebase Authentication (Email/Password)
- 💾 Cloud storage with Firestore
- 📱 Responsive design for all devices
- 📄 Export letters to multi-page PDF
- 🎯 Send letters to specific recipients
- 📬 Mailbox to manage sent and received letters

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Yarn
- Firebase project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/RandyGrullon/letter-maker.git
cd letter-maker
```

2. Install dependencies:
```bash
yarn install
```

3. Set up Firebase configuration:
   - Copy `src/lib/firebase-config.example.ts` to `src/lib/firebase-config.ts`
   - Add your Firebase credentials:
   ```typescript
   export const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT.firebasestorage.app",
       messagingSenderId: "YOUR_SENDER_ID",
       appId: "YOUR_APP_ID",
   };
   ```

4. Run the development server:
```bash
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Enable Storage for images
5. Update security rules (see `storage.rules`)

### Environment Variables (Optional)

Create `.env.local` file:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 📦 Build

```bash
yarn build
```

## 🚢 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/RandyGrullon/letter-maker)

1. Push your code to GitHub
2. Import project in Vercel
3. Add Firebase configuration in Vercel Environment Variables
4. Deploy!

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **PDF Generation**: jsPDF + html2canvas
- **Icons**: Lucide React

## 📁 Project Structure

```
letter-maker/
├── src/
│   ├── app/              # Next.js app routes
│   │   ├── create/       # Create letter page
│   │   ├── edit/         # Edit letter page
│   │   ├── letter/       # View letter page
│   │   ├── login/        # Login page
│   │   ├── mailbox/      # User mailbox
│   │   └── register/     # Registration page
│   ├── components/       # React components
│   │   ├── Builder/      # Letter builder components
│   │   ├── Letter/       # Letter display components
│   │   └── UI/           # Reusable UI components
│   ├── lib/              # Utilities and configs
│   │   ├── firebase.ts   # Firebase initialization
│   │   ├── db.ts         # Database operations
│   │   ├── storage.ts    # File storage operations
│   │   └── auth-context.tsx # Auth context provider
│   └── types/            # TypeScript type definitions
└── public/               # Static assets
```

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**Randy Grullon**

- GitHub: [@RandyGrullon](https://github.com/RandyGrullon)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

---

Made with ❤️ by Randy Grullon
