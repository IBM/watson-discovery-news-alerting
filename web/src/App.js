import React, { Component } from 'react';
import { Header, Footer, Jumbotron, InputWithButton, Bar, Icon, TextInput, Radio, RadioGroup, JsonLinkInline } from 'watson-react-components/dist/components';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts/lib';
import { Grid, Row, Col } from 'react-bootstrap';

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

class QueryWithExamples extends Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedValue: null,
      selectedQuery: ''
    }

    this.handleExampleChange = this.handleExampleChange.bind(this)
  }

  queryForExample(example) {
    var query = null
    switch(example) {
      case 'alert': {
        query = 'IBM filter=enrichedTitle.relations.action.verb.text:[downgrade|upgrade],enrichedTitle.relations.subject.entities.type::Company aggregation=timeslice(blekko.chrondate, 1day, America/Los_Angeles)'
        break
      }

      case 'event': {
        query = 'enrichedTitle.taxonomy.label::/finance/bank filter=enrichedTitle.relations.subject.entities.type::Company,enrichedTitle.relations.action.verb.text:aquire aggregation=timeslice(blekko.chrondate, 1day, America/Los_Angeles)'
        break
      }
    }

    return query
  }

  handleExampleChange(value) {
    this.setState({
      selectedValue: value,
      selectedQuery: this.queryForExample(value)
    })
  }

  render() {
    return (
      <div>
        <Row>
          <Col md={12}>
            <h2>Example Queries</h2>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <RadioGroup tabStyle={true}
                        selectedValue={this.state.selectedValue}
                        onChange={this.handleExampleChange}>
              <Radio className='fullWidth' value='alert'>News alerts for a company being upgraded or downgraded by stock analysts: <TextInput placeholder='IBM' id='alertCompanyName' onFocus={_ => this.handleExampleChange('alert') }/></Radio>
              <Radio className='fullWidth' value='event'>Event alerts for company aquisitions in the industry: <TextInput placeholder='/finance/bank' id='eventCompanyName' onFocus={_ => this.handleExampleChange('event') }/></Radio>
            </RadioGroup>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <div className='input-with-button'>
              <textarea
                autoFocus
                placeholder='Watson Discovery News Query'
                value={this.state.selectedQuery} />
              <button
                className='input-with-button--button'
                >
                <Icon type="right" size="small" />
              </button>
            </div>
          </Col>
        </Row>
      </div>
    )
  }
}

const SimpleLineChart = _ => {
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
  )
}

const Home = _ => (
  <div>
    <Header
      mainBreadcrumbs='Discovery News'
      mainBreadcrumbsUrl=''
      subBreadcrumbs='Alerting'
      subBreadcrumbsUrl=''
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
      <Row>
        <Col md={6}>
          <QueryWithExamples />
        </Col>
        <Col md={6}>
          <h2>Discovery News Alerts and Events</h2>
          <p>TODO further describe in detail the usage of these example queries and how they may be expanded upon for new discoveries.</p>
        </Col>
      </Row>
    </Grid>
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
