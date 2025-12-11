# Database

## Users

### Path

`/users/{uid}`

### Data

```json
{
  "displayName": "Alex",
  "email": "alex@example.com",
  "photoURL": "https://...", // this might need to change based on auth
  "settings": {}, // in case we need a user-level setting

  "totalHikes": 12,                   // total completed hikes by this user
  "totalDistance": 54321,             // total distance across all hikes (meters)
  "totalElevation": 21000,            // total elevation across all hikes (meters)
  "updatedAt": "<Timestamp>"

```

## Hikes

### Path

`/users/{uid}/hikes/{hikeId}`

### Data

```json
{
  "name": "Morning Loop",
  "status": "in_progress",            // "in_progress" or "completed"
  "startedAt": <Timestamp>,
  "finishedAt": <Timestamp>,          // null while in_progress
  "durationSec": 5400,                // calculated at very end
  "distanceMeters": 8234,             // tbd when/how to be calculated
  "elevationGainMeters": 430,         // tbd when/how to be calculated
  "caption": "Great views at the top",// could be useful if we want to a note with hikes
  "createdAt": <Timestamp>,
  "pohotoCount:"                      // total number of photos taken during the hike
  "trail": [{                         // ordered by trail order
    "alt": 10,                        // altitude
    "lat": 10.1212,
    "long": 10.212,
  },]
}
```

## Photos

### Path

`/users/{uid}/hikes/{hikeId}/photos/{photoId}`

### Data

```json
{
  "storagePath": "users/uid/hikes/hikeId/photos/photoId.jpg",  // CDN dependent
  "downloadURL": "https://firebasestorage.googleapis.com/...", // CDN dependent
  "timestamp": <Timestamp>,        // when taken
  "location": {
    "lat": 10.2,
    "long": 10.2,
  }
  "altitudeMeters": 1502,
  "description": "top of mountain",
  "createdAt": <Timestamp>
}
```

## Goals

### Path

`/users/{uid}/goals/{goalId}`

where `{goalId}` is `weekly` or `monthly` or `annualy`.

### Data

```json
{
  "type": "weekly",
  "hikesTarget": 3,
  "distanceMetersTarget": 20000,
  "photosTarget": 10,
  "createdAt": <Timestamp>,
  "updatedAt": <Timestamp>
}
```
