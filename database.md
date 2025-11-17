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
  "createdAt": <Timestamp>,
  "homeLocation": <GeoPoint>,   //  could be useful for the weather widget
  "settings": {} // in case we need a user-level setting
}

```

## Hikes
### Path
`/users/{uid}/hikes/{hikeId}`
### Data
```json
{
  "name": "Morning Loop",
  "status": "in_progress",          // "in_progress" or "completed" or "cancelled"
  "startedAt": <Timestamp>,
  "endedAt": <Timestamp>,           // null while in_progress
  "durationSec": 5400,              // calculated at very end
  "distanceMeters": 8234,           // tbd when/how to be calculated
  "elevationGainMeters": 430,       // tbd when/how to be calculated
  "startLocation": <GeoPoint>,      // first point
  "endLocation": <GeoPoint>,        // last point, calculated when ending
  "notes": "Great views at the top",// could be useful if we want to a note with hikes
  "createdAt": <Timestamp>,
  "updatedAt": <Timestamp>
}
```

## Hikes Datapoints
### Path
`/users/{uid}/hikes/{hikeId}/trackPoints/{pointId}`
### Data
```json
{
  "timestamp": <Timestamp>,
  "location": <GeoPoint>,
  "altitudeMeters": 1523.4,
  "sequence": 123,                  // for ordering of points (1st, 2nd, etc.)
  "cumulativeDistanceMeters": 3456  // could be useful for displaying where on line
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
  "location": <GeoPoint>,          // where the user was
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