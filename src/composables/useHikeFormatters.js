export function useHikeFormatters() {
  function formatDuration(seconds) {
    if (!seconds) return 'N/A'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes} min`
  }

  function formatDistance(meters) {
    if (!meters) return 'N/A'
    return `${(meters / 1000).toFixed(1)} km`
  }

  function formatElevation(meters) {
    if (meters === undefined || meters === null) return 'N/A'
    return `${Math.round(meters)} m`
  }

  function formatTime(timestamp) {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  function formatDatetime(timestamp) {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return (
      date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) +
      ' ' +
      date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    )
  }

  return {
    formatDuration,
    formatDistance,
    formatElevation,
    formatTime,
    formatDatetime,
  }
}
