# 504 Essential Words - React App

A modern, interactive vocabulary learning application built with React, Vite, and Firebase. Learn the 504 most essential English words through structured lessons, multimedia content, and gamified practice sessions.

## Features

- 📚 **42 Structured Lessons** - Each lesson contains 12 carefully selected essential words
- 🎯 **Interactive Learning** - Multiple choice quizzes, audio pronunciations, and video examples
- 🏆 **Gamification** - Earn points, track progress, and compete with other learners
- 📱 **Responsive Design** - Works perfectly on mobile, tablet, and desktop
- 🔊 **Audio Support** - British and American pronunciation guides
- 🎥 **Video Examples** - Real-world usage in context
- 🔐 **Authentication** - Google OAuth and email/password sign-in
- ⚡ **Real-time Rankings** - See how you compare with other learners

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication)
- **Deployment**: Firebase Hosting
- **State Management**: React Context API
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.jsx      # Navigation bar
│   ├── WordCard.jsx    # Word detail display
│   ├── LoadingSpinner.jsx
│   └── ProtectedRoute.jsx
├── contexts/           # React Context providers
│   └── AuthContext.jsx # Authentication state management
├── lib/               # Utility libraries
│   ├── firebase.js    # Firebase configuration
│   └── utils.js       # Helper functions
├── pages/             # Page components
│   ├── HomePage.jsx
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── LessonsPage.jsx
│   ├── LessonDetailPage.jsx
│   ├── WordDetailPage.jsx
│   ├── LearnPage.jsx
│   ├── RankingPage.jsx
│   └── ProfilePage.jsx
├── services/          # API and data services
│   └── firebaseService.js
└── App.jsx           # Main application component
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project with Firestore and Authentication enabled