service cloud.firestore {
  match /databases/{database}/documents {
    // Allow only authenticated content owners access
    match /some_collection/{userId}/{document} {
      allow read, write: if request.auth != null && request.auth.uid == userId
    }
  }
}