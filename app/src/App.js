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
