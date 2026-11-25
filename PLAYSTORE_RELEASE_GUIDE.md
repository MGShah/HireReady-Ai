# 🚀 Google Play Store Release Guide — Nexa

**Brand:** Nexa  
**Tagline:** When Talent Meets Intelligence  
**Package / Application ID:** `com.nexa.career`  
**Current Version:** 1.0.0 (Version Code: 1)  

---

## 📋 1. Google Play Console Listing Metadata

When filling out your store listing in [Google Play Console](https://play.google.com/console), use these pre-formatted fields:

| Field | Content | Character Limit |
|---|---|---|
| **App Name** | `Nexa: AI Career Accelerator` | 29 / 30 chars |
| **Short Description** | `When Talent Meets Intelligence. ATS resume, AI mock interview & roadmap.` | 73 / 80 chars |
| **Category** | `Productivity` or `Business` | — |
| **Tags** | Careers, Resume, Interview Preparation, Job Search, AI | — |
| **Privacy Policy URL** | `https://your-domain.com/privacy-policy.html` *(or hosted via GitHub Pages / Netlify / Vercel)* | Required |

### Full Description (Copy & Paste directly into Play Console):

```markdown
When Talent Meets Intelligence — Welcome to Nexa, your personal AI career copilot designed to help you land your dream job faster.

Whether you are preparing for your first tech job, switching careers, or aiming for a senior engineering role, Nexa equips you with industry-grade tools built for modern hiring standards.

🌟 KEY FEATURES:

📄 ATS-Compliant Resume Builder
• Instant resume formatting compliant with modern Applicant Tracking Systems (ATS).
• Automated bullet point enhancement and action-verb phrasing powered by AI.
• Live side-by-side editing and one-click PDF export.
• Pre-built modern, classic, and minimal templates.

🎙️ Interactive AI Mock Interview Lab
• Practice realistic technical, behavioral, and HR interview questions.
• Choose your target role (Software Engineer, Full Stack, Data Scientist, Product Manager, etc.) and difficulty level.
• Receive real-time, actionable feedback scored on relevance, depth, and clarity using the STAR framework.

🎯 Skill Gap Analysis & Career Roadmaps
• Pinpoint exactly which skills you're missing for your target role.
• Receive tailored, step-by-step learning roadmaps with curated milestones.
• Stay ahead of industry hiring trends.

💼 Job Application Pipeline Tracker
• Visual Kanban-style tracker from 'Saved' to 'Offer'.
• Keep track of interview schedules, recruiter contacts, and customized cover letters.
• Stay organized and never miss a follow-up.

🔒 Privacy & Security:
Your career data belongs to you. Nexa uses end-to-end encryption in transit (HTTPS/TLS) and never sells your data to third-party brokers.

When Talent Meets Intelligence. Download Nexa today and accelerate your career!
```

---

## 🛠️ 2. How to Build the Android App Bundle (.aab)

Google Play Store requires an **Android App Bundle (`.aab`)** for all new app submissions.

### Step 2.1: Build & Sync Web Assets
From the root project directory:
```bash
npm run build:android
```
*(This builds the Vite React production bundle into `client/dist` and syncs it with the native Android project).*

### Step 2.2: Generate a Release Keystore (Signing Key)
Run this command once in your terminal to create your signing key:
```bash
keytool -genkey -v -keystore client/android/nexa-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias nexa
```
> ⚠️ **IMPORTANT**: Save this keystore file and its password safely! If lost, Google Play will not allow you to update your app.

### Step 2.3: Build the Release `.aab` Bundle
Navigate to the `client/android` directory and run Gradle:

On Windows (PowerShell):
```powershell
cd client/android
.\gradlew bundleRelease
```

On macOS / Linux:
```bash
cd client/android
./gradlew bundleRelease
```

Your upload bundle will be generated at:
`client/android/app/build/outputs/bundle/release/app-release.aab`

*(For local testing on an Android device or emulator, you can also run `.\gradlew assembleDebug` to get an `.apk` at `client/android/app/build/outputs/apk/debug/app-debug.apk`).*

---

## 🎨 3. Graphic Assets Required by Google Play

Prepare the following graphics before publishing:

1. **App Icon:**
   - 512 × 512 px PNG (32-bit color, max 1024 KB).
   - Located at: `client/public/favicon.svg` (or export to 512x512 PNG).
2. **Feature Graphic:**
   - 1024 × 500 px PNG or JPEG (no alpha channel).
   - Displays your logo "Nexa" with tagline "When Talent Meets Intelligence".
3. **Phone Screenshots:**
   - Minimum 2 screenshots (Recommended: 4–8 screenshots).
   - Minimum dimension: 320 px, maximum dimension: 3840 px (16:9 or 18:9 aspect ratio).
   - Recommended screens to capture:
     1. Home / Dashboard
     2. Resume Builder with live preview
     3. AI Mock Interview Lab
     4. Skill Gap Roadmaps
     5. Application Tracker

---

## 🛡️ 4. Google Play Console Compliance & Policies

### A. Privacy Policy URL
Google strictly requires a public URL. A ready-to-use policy has been created in:
`client/public/privacy-policy.html`  
Once your app is deployed to your domain (e.g. `https://nexa.yourdomain.com/privacy-policy.html`), copy and paste that link into the **App Content > Privacy Policy** section in Google Play Console.

### B. Data Safety Questionnaire Answers
When filling out the **Data Safety** section on Google Play:
- **Data collected:**
  - *Personal info:* Name, Email address (for account authentication).
  - *App activity:* Resume and interview responses (for app functionality).
- **Is data encrypted in transit?** Yes (all traffic uses HTTPS/TLS).
- **Can users request data deletion?** Yes (users can request deletion of account and resumes).
- **Is data shared with third parties?** No (not sold or shared with third-party advertisers).

### C. Target Audience & Content Rating
- Select **13+ / All audiences**.
- Answer "No" to alcohol, gambling, violence, and adult content questions.

---

## 🚀 5. Google Play Testing & Rollout Procedure

> ℹ️ **Google Personal Developer Account Policy:**  
> For personal accounts created after November 2023, Google requires:
> 1. Running a **Closed Testing Track** with at least **14 or 20 opted-in testers**.
> 2. Testers must remain opted in for **14 consecutive days**.
> 3. After 14 days of testing, the "Apply for Production" button is unlocked in Play Console.

### Quick Step-by-Step in Play Console:
1. Log in to [Google Play Console](https://play.google.com/console).
2. Click **Create app** -> Enter `Nexa: AI Career Accelerator`, select Free or Paid.
3. Complete all items in the **Set up your app** checklist (Store listing, content rating, target audience, privacy policy).
4. Go to **Testing > Closed testing** -> Create a track -> Upload `app-release.aab`.
5. Add your testers' Google emails.
6. Once closed testing concludes, submit to **Production** for Google review!
