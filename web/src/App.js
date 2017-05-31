import React, { Component } from 'react';
import { Header, Footer, Jumbotron } from 'watson-react-components/dist/components';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts/lib';
import './App.css';
import 'watson-react-components/dist/css/watson-react-components.min.css'

import {
    BrowserRouter as Router,
    Route
} from 'react-router-dom'


const data = [
        {name: 'A', amount: 0.1},
        {name: 'B', amount: 0.2},
        {name: 'C', amount: 0.3},
        {name: 'D', amount: 0.2},
        {name: 'E', amount: 0.4},
        {name: 'F', amount: 0.1},
        {name: 'G', amount: 0.1},
];

class SimpleLineChart extends Component {
  render () {
    return (
      <LineChart width={600} height={300} data={data}
            margin={{top: 5, right: 30, left: 20, bottom: 5}}>
       <XAxis dataKey='name'/>
       <YAxis/>
       <CartesianGrid strokeDasharray='3 3'/>
       <Tooltip/>
       <Legend />
       <Line type='monotone' dataKey='amount' stroke='#8884d8' activeDot={{r: 8}}/>
      </LineChart>
    );
  }
}

const Home = _ => (
  <div>
    <Header
      mainBreadcrumbs='Discovery News'
      mainBreadcrumbsUrl=''
      subBreadcrumbs='Tracking'
      subBreadcrumbsUrl=''
      hasWordmark={true} />
    <Jumbotron
      serviceName='Discovery News Tracking'
      repository='https://github.com/watson-developer-cloud/TODO'
      documentation='https://www.ibm.com/watson/developercloud/TODO'
      apiReference='https://www.ibm.com/watson/developercloud/TODO'
      startInBluemix='TODOhttps://console.ng.bluemix.net/registration/?target=/catalog/services/visual-recognition/'
      version='Beta'
      serviceIcon='images/service-icon.svg'
      description="TODO: Integrate Watson's Discovery News service into existing workflows using a Slack bot and periodic push updates."
    />
    <Footer />
  </div>
)

const Example = _ => (
  <div>
    <SimpleLineChart />
  </div>
)

const App = _ => (
  <Router>
    <div>
      <Route exact path='/' component={Home} />
      <Route path='/example' component={Example} />
    </div>
  </Router>
)

export default App;
