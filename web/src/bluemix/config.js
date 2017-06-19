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

  if (credentials == null) {
    throw new ReferenceError(`No credentials found for the ${requestedService} service.`)
  }

  return credentials
}
