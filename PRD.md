# Product Requirements Document (PRD)
## Smart Class Check-in & Learning Reflection App

**Course:** 1305216 Mobile Application Development  
**Version:** 1.0 (MVP)  
**Date:** 13 Mar 2026  
**Owner:** 6731503062 Kyaw Hmue San 

**Implementation Note:** Instructor approved React Native (Expo) implementation due local Flutter setup limitation. Functional requirements are unchanged.

## 1. Problem Statement
Class attendance alone does not prove real participation. The university needs a lightweight system that verifies student physical presence and captures short learning reflections for each class session. The system must be fast enough for classroom use, simple for students, and feasible to build as an MVP in one lab exam.

## 2. Target Users
- University students attending in-person classes
- Instructor (indirect stakeholder) who needs more reliable participation evidence
- Course admin (indirect stakeholder) who may review attendance/reflection records

## 3. Product Goals
- Confirm class presence using GPS + QR scan at start of class
- Confirm class completion using GPS + QR scan at end of class
- Capture meaningful but short student reflections before and after class
- Persist records locally for MVP reliability
- Deploy at least one component via Firebase Hosting

## 4. MVP Scope
### In Scope
- Home screen with navigation
- Check-in flow (before class)
- Finish class flow (after class)
- GPS capture and timestamp
- QR scanning
- Required form validation
- Local persistence using SQLite (or equivalent local storage)
- Firebase Hosting deployment of one component (Expo web build or landing page)

### Out of Scope (for MVP)
- Authentication with university SSO
- Multi-role dashboards
- Analytics and charts
- Offline-to-cloud sync conflict resolution
- Push notifications

## 5. Core Features
### Feature A: Class Check-in (Before Class)
- Student taps **Check-in**
- App captures current timestamp and GPS coordinates
- Student scans class QR code
- Student submits:
  - Previous class topic
  - Expected topic today
  - Mood before class (1-5)

### Feature B: Class Completion (After Class)
- Student taps **Finish Class**
- App captures current timestamp and GPS coordinates
- Student scans class QR code again
- Student submits:
  - What was learned today (short text)
  - Feedback about class/instructor

### Feature C: Data Storage
- Store check-in and check-out data in local database
- Keep one record per class session per student (MVP assumption)
- Allow viewing saved records from home screen (optional but recommended)

## 6. User Flow
### Check-in Flow
1. Open app -> Home
2. Tap **Check-in**
3. Grant location/camera permission if prompted
4. Capture GPS and timestamp
5. Scan QR code
6. Fill required fields and mood
7. Tap **Submit Check-in**
8. App validates and saves local record with `status = checked_in`

### Finish Class Flow
1. Open app -> Home
2. Tap **Finish Class**
3. Grant location/camera permission if prompted
4. Capture GPS and timestamp
5. Scan QR code
6. Fill required post-class fields
7. Tap **Submit Finish**
8. App validates and updates open session to `status = completed`

## 7. Data Fields (MVP Schema)
**Suggested table:** `class_sessions`

| Field | Type | Required | Description |
|---|---|---|---|
| id | TEXT (unique string) | Yes | Unique record ID |
| studentId | TEXT | Yes | Student identifier |
| classCode | TEXT | Yes | Class/course code |
| sessionDate | TEXT (YYYY-MM-DD) | Yes | Date of session |
| checkInTime | TEXT (ISO8601) | Yes | Before-class timestamp |
| checkInLat | REAL | Yes | Check-in latitude |
| checkInLng | REAL | Yes | Check-in longitude |
| checkInQr | TEXT | Yes | QR payload at check-in |
| previousTopic | TEXT | Yes | Topic from previous class |
| expectedTopic | TEXT | Yes | Expected topic today |
| moodBefore | INTEGER (1-5) | Yes | Pre-class mood score |
| checkOutTime | TEXT (ISO8601) | No | After-class timestamp |
| checkOutLat | REAL | No | Check-out latitude |
| checkOutLng | REAL | No | Check-out longitude |
| checkOutQr | TEXT | No | QR payload at finish |
| learnedToday | TEXT | No | What student learned |
| feedback | TEXT | No | Student feedback |
| status | TEXT | Yes | `checked_in` or `completed` |
| createdAt | TEXT (ISO8601) | Yes | Record created time |
| updatedAt | TEXT (ISO8601) | Yes | Record updated time |

## 8. Validation Rules
- Check-in cannot submit without GPS, QR, previous topic, expected topic, mood
- Mood must be integer in range 1-5
- Finish class cannot submit without GPS, QR, learnedToday, feedback
- Finish class requires an existing `checked_in` record for that session
- Text inputs are trimmed and must not be empty
- Permission denial should show clear retry guidance

## 9. Tech Stack
- **Frontend:** React Native (Expo)
- **State/Form:** React state hooks and controlled inputs
- **Location:** `expo-location`
- **QR Scanner:** `expo-camera`
- **Local DB:** `expo-sqlite`
- **ID generation:** internal timestamp/random ID utility
- **Deployment:** Firebase Hosting
- **Optional cloud extension:** Firebase Firestore (if time allows)

## 10. Non-Functional Requirements
- Simple and fast classroom interaction (target submit flow under 30 seconds)
- Works on Android device and can deploy one web component for submission
- Basic error handling for location/camera/scan failures
- Readable, maintainable code structure with clear screen separation

## 11. Acceptance Criteria (MVP)
- Home, Check-in, and Finish screens are functional
- GPS can be captured and shown/saved
- QR scan works and value is saved
- Required forms validate correctly
- Check-in creates local record
- Finish class updates corresponding local record
- App data persists after app restart
- At least one component is live on Firebase Hosting with a public URL
- Repository includes source code, README, PRD, and AI usage report

## 12. Risks and Mitigations
- **Risk:** Camera/location permission denied  
  **Mitigation:** Show permission rationale and retry actions
- **Risk:** QR scan fails in low light  
  **Mitigation:** Allow rescan with clear scanner guidance and retry flow
- **Risk:** No matching check-in for finish flow  
  **Mitigation:** Show clear error and prevent invalid submit
- **Risk:** Time overrun  
  **Mitigation:** Prioritize end-to-end MVP before enhancements