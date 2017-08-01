/**
 * Copyright 2017 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License'); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

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

// Taken from https://stackoverflow.com/a/36247412/1589147 for use in padding dates to work with Watson
export const leftPad = (s, c, n) => {
  s = s.toString()
  c = c.toString()
  return s.length > n ? s : c.repeat(n - s.length) + s
}
