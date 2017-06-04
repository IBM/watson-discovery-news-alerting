import React from 'react'
import { Header, Footer, Jumbotron } from 'watson-react-components/dist/components'
import { Grid } from 'react-bootstrap'

import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'

import { ExampleList, Example } from './components/examples'

import './App.css'
import 'watson-react-components/dist/css/watson-react-components.min.css'
import 'url-search-params-polyfill'

const Home = () => (
  <div>
    <Header
      mainBreadcrumbs='Discovery News'
      mainBreadcrumbsUrl='/'
      hasWordmark={true} />
    <Jumbotron
      serviceName='Discovery News Alerting'
      repository='https://github.com/watson-developer-cloud/TODO'
      documentation='https://www.ibm.com/watson/developercloud/TODO'
      apiReference='https://www.ibm.com/watson/developercloud/TODO'
      startInBluemix='TODOhttps://console.ng.bluemix.net/registration/?target=/catalog/services/visual-recognition/'
      version='Beta'
      serviceIcon='images/service-icon.svg'
      description="TODO: Integrate Watson's Discovery News Service into existing workflows using a Slack application and periodic push updates."
    />
    <Grid>
      <ExampleList />
    </Grid>
    <Footer />
  </div>
)

const App = () => (
  <Router>
    <Switch>
      <Route exact path='/' component={Home} />
      <Route path='/example' component={Example} />
    </Switch>
  </Router>
)

export default App
