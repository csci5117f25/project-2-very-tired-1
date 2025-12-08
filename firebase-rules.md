service cloud.firestore {
  match /databases/{database}/documents {
    // Users can manage their own profile
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // Users can manage their own hikes
    match /users/{uid}/hikes/{hikeId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

		// Users can manage their own photos
    match /users/{uid}/hikes/{hikeId}/photos/{photoId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // Users can manage their own goals
    match /users/{uid}/goals/{goalId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}