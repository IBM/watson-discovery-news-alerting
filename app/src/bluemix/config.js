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

import cfenv from 'cfenv'

// Wrapper to get the service by label (Cloudant or Discovery) to avoid duplicating this logic in multiple places
export function getCredentials(requestedService) {
  const appEnv = cfenv.getAppEnv()

  const services = appEnv.getServices()
  let credentials = null
  for (let serviceName of Object.keys(services)) {
    if (services[serviceName].label === requestedService) {
      credentials = services[serviceName].credentials
    }
  }

  if (credentials === null) {
    throw new ReferenceError(`No credentials found for the ${requestedService} service.`)
  }

  return credentials
}
