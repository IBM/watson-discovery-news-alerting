// Simple selection of rounded rough dates used in a few locations.
// NOTE if this were a larger project, I'd recommend a better date library like moment.js because this is inaccurate with Months and above

// Considering in UTC time
export const day = 24 * 60 * 60 * 1000
export const week = day * 7

// Rounding month to 30 days
export const month = day * 30

export function today() {
  return new Date()
}

export function yesterday() {
  return new Date(today().getTime() - day)
}

export function lastWeek() {
  return new Date(today().getTime() - week)
}

export function lastMonth() {
  return new Date(today().getTime() - month)
}

export function nextMonth() {
  return new Date(today().getTime() + month)
}

export function tomorrow() {
  return new Date(today().getTime() + day)
}
