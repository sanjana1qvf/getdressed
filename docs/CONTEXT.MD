# 👗 AI Outfit Enhancer – App Flow & Feature Documentation

This document outlines the structure, flow, and features of the **AI Outfit Enhancer** app – an app that lets users click/upload photos of their outfits, receive AI-powered ratings & suggestions, and maintain a digital wardrobe history.

---

## 🏁 1. Welcome & Authentication Flow

### 📱 Welcome Screen
- Displays app name and tagline (e.g., *"Enhance Your Look with AI"*)
- Two buttons:
  - `Login`
  - `Sign Up`

### 🔐 Authentication
- **Email-based login/signup** only
- Upon signing up:
  - Capture: Name, Email, Age
  - Store in basic user profile
- After successful login/signup, redirect user to the **Main Dashboard**

---

## 🧭 2. Main Navigation (Bottom Tab Bar)

Once inside the app, the user sees a bottom tab bar with 3 options:

### 1. 👕 Upload
### 2. 🧥 Wardrobe  
### 3. 👤 Profile

---

## 📤 3. Upload Flow (AI Outfit Analysis)

### Upload Screen Features:
- Two options:
  - `Upload a photo from gallery`
  - `Click a new photo using camera`
- Once a photo is uploaded/captured:
  - Display loading animation with playful fashion-related texts (e.g., *"Inspecting your drip..."*)

### AI Processing:
- AI analyses:
  - Clothing colors, fit, patterns
  - Accessories (if visible)
  - Footwear
  - Overall harmony
  - Pose clarity
- AI checks:
  - Occasion suitability (Casual, Formal, Party, Gym, etc.)

### Output After Analysis:
- **Rating (out of 10)**
- **Key Suggestions** (3-5 lines)
  - E.g., "Try lighter colors on top", "Avoid skinny jeans with bulky sneakers", "Add a contrast layer like denim jacket"
- **Occasion Fit Feedback**
  - E.g., "Looks party ready!" or "Not suitable for formal settings."

### Save to Wardrobe:
- Automatically save:
  - Image
  - Date/Time
  - Rating
  - Occasion tag (predicted by AI)
  - Feedback/suggestions

---

## 🗂️ 4. Wardrobe (History Viewer)

### Features:
- Chronological list/grid of past outfit photos
- Each item shows:
  - Outfit image (thumbnail)
  - Rating (out of 10)
  - Date
- Tap on item to open **detailed view**:
  - Full image
  - Feedback
  - Occasion tag
  - Option to delete or favorite the outfit

---

## 🙍 5. Profile Section

### Basic Details:
- Name
- Age
- Email

### Options:
- Edit Profile (optional in v2)
- Logout Button

---

## 🧠 6. AI Engine (Backend Logic Overview)

### Input:
- Photo from user

### AI Output:
- Outfit rating
- Occasion classification
- Styling suggestions

### Model Notes (for devs):
- Use computer vision + fine-tuned outfit classification models
- Use GPT-based logic for text suggestions
- Store analysis in Firebase/Firestore/DB for retrieval

---

## 🧪 7. Future Enhancements (Optional Ideas)

- Allow AI to suggest alternate combinations from user's wardrobe
- Add filters to wardrobe (e.g., by rating, occasion)
- Occasion selection by user before upload
- Social sharing of outfits
- Style evolution tracker over time

---

## 🧰 Tech Stack

| Component        | Technology               |
|------------------|--------------------------|
| Frontend         | React Native with TypeScript, Expo, and Expo Router |
| Backend/Database | Supabase                 |
| UI Framework     | React Native Paper       |
| AI Processing    | OpenAI                   |
| Authentication   | Supabase Auth            |
| Storage          | Supabase Storage         |
| Database         | Supabase PostgreSQL      |

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  age INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Outfits Table
```sql
CREATE TABLE outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10),
  occasion VARCHAR(50),
  suggestions TEXT[],
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### User Sessions Table
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Database Indexes
```sql
-- Performance indexes
CREATE INDEX idx_outfits_user_id ON outfits(user_id);
CREATE INDEX idx_outfits_created_at ON outfits(created_at DESC);
CREATE INDEX idx_outfits_rating ON outfits(rating DESC);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
```

---

## 📁 Optimal Folder Structure

```
ai-outfit-enhancer/
├── app/                          # Expo Router app directory
│   ├── (auth)/                   # Authentication routes
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── _layout.tsx
│   ├── (tabs)/                   # Main app tabs
│   │   ├── upload/               # Upload flow
│   │   │   ├── index.tsx         # Upload screen
│   │   │   ├── processing.tsx    # AI processing screen
│   │   │   └── result.tsx        # Results screen
│   │   ├── wardrobe/             # Wardrobe history
│   │   │   ├── index.tsx         # Wardrobe list
│   │   │   └── [id].tsx          # Outfit detail view
│   │   ├── profile/              # User profile
│   │   │   └── index.tsx
│   │   └── _layout.tsx           # Tab layout
│   ├── _layout.tsx               # Root layout
│   └── index.tsx                 # Entry point
├── components/                   # Reusable components
│   ├── ui/                       # UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── RatingDisplay.tsx
│   ├── forms/                    # Form components
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   ├── camera/                   # Camera components
│   │   ├── CameraView.tsx
│   │   └── ImagePicker.tsx
│   └── wardrobe/                 # Wardrobe components
│       ├── OutfitCard.tsx
│       ├── OutfitGrid.tsx
│       └── OutfitDetail.tsx
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts
│   ├── useCamera.ts
│   ├── useOutfits.ts
│   └── useSupabase.ts
├── services/                     # API and external services
│   ├── supabase/                 # Supabase client and queries
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── outfits.ts
│   │   └── storage.ts
│   ├── ai/                       # AI processing
│   │   ├── openai.ts
│   │   └── outfitAnalysis.ts
│   └── api/                      # API endpoints
│       └── upload.ts
├── utils/                        # Utility functions
│   ├── constants.ts
│   ├── helpers.ts
│   ├── types.ts
│   └── validation.ts
├── assets/                       # Static assets
│   ├── images/
│   ├── icons/
│   └── fonts/
├── styles/                       # Global styles
│   ├── theme.ts
│   └── global.ts
├── config/                       # Configuration files
│   ├── supabase.ts
│   └── openai.ts
├── app.json                      # Expo config
├── package.json
├── tsconfig.json
├── babel.config.js
└── README.md
```

### Key Structure Benefits:
- **Expo Router**: File-based routing for better organization
- **Type Safety**: Full TypeScript implementation
- **Component Separation**: Clear separation of concerns
- **Service Layer**: Isolated API and external service calls
- **Hooks Pattern**: Reusable logic with custom hooks
- **Scalable**: Easy to add new features and maintain

---

## ✅ MVP Summary Checklist

- [x] Login / Signup via Email
- [x] Bottom Tab Navigation (Upload, Wardrobe, Profile)
- [x] Upload Photo (Camera + Gallery)
- [x] AI Outfit Rating + Suggestions
- [x] Store & Display Outfit History
- [x] Basic User Profile Page
- [x] Logout Option

---

> 🔍 This app solves a core need: **"How do I look?"** — without the need to upload your entire wardrobe or do manual styling. Minimal effort, maximum fashion value.
