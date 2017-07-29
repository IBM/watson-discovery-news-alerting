import React from 'react'
import { Header, Footer, Jumbotron } from 'watson-react-components/dist/components'
import { Grid } from 'react-bootstrap'

import { Route, Switch } from 'react-router-dom'

import { ExampleList, Example } from './components/examples'
import { CurrentSubscriptions } from './components/subscription'

import './App.css'
import 'watson-react-components/dist/css/watson-react-components.min.css'

// Primary homepage
const Home = () => (
  <div>
    <Header
      mainBreadcrumbs='Discovery News'
      mainBreadcrumbsUrl='/'
      hasWordmark={true} />
    <Jumbotron
      serviceName='Discovery News Alerting'
      repository='https://github.com/IBM/watson-discovery-news-alerting'
      documentation='https://www.ibm.com/watson/developercloud/doc/discovery/index.html'
      apiReference='https://www.ibm.com/watson/developercloud/discovery/api/v1/'
      version='Beta'
      description="Monitor a product's marketplace life-cycle using Watson's Discovery service to intelligently alert when a product's stance in the marketplace has changed. Receive periodic updates via email related to a product or brand and how they're perceived in the News."
    />
    <Grid>
      <ExampleList />
    </Grid>
    <Footer />
  </div>
)

const App = () => (
  <Switch>
    <Route exact path='/' component={Home} />
    <Route path='/track' component={Example} />
    <Route path='/subscription' component={CurrentSubscriptions} />
  </Switch>
)

export default App
