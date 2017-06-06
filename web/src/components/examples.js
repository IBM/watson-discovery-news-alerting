import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts/lib'
import { Grid, Row, Col, ListGroup, ListGroupItem } from 'react-bootstrap'
import { Header, Footer, Icon, TextInput, Radio, RadioGroup, Alert, JsonLinkInline } from 'watson-react-components/dist/components'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import 'whatwg-fetch'

import { Tracking } from './tracking'

// Taken from https://github.com/github/fetch/issues/256
function toQueryString(params) {
  return Object.keys(params)
      .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
      .join('&')
}

// https://stackoverflow.com/a/36247412/1589147
const leftPad = (s, c, n) => {
  s = s.toString()
  c = c.toString()
  return s.length > n ? s : c.repeat(n - s.length) + s
}

class SimpleLineChart extends Component {
  constructor(props) {
    super(props)
    this.state = {
      data: props.data,
      name: props.name
    }
  }

  render() {
    return (
      <LineChart width={600} height={300} data={this.state.data}
            margin={{top: 5, right: 30, left: 20, bottom: 5}}>
       <XAxis dataKey='name'/>
       <YAxis/>
       <CartesianGrid strokeDasharray='3 3'/>
       <Tooltip/>
       <Legend />
       <Line name={this.state.name} type='monotone' dataKey='amount' stroke='rgb(152, 85, 212)' activeDot={{r: 8}}/>
      </LineChart>
    )
  }
}
SimpleLineChart.propTypes = {
  name: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired
}

const Loader = (props) => {
  const cols = props.cols
  return (
    <Col md={cols}>
      <div className='center-block center-text'>
        <Icon type="loader" size="large" />
        <p>Loading Alerts from Watson</p>
      </div>
    </Col>
  )
}
Loader.propTypes = {
  cols: PropTypes.number.isRequired
}

class AlertExample extends Component {
  constructor(props) {
    super(props)

    this.state = {
      match: props.match,
      params: new URLSearchParams(props.location.search),
      error: false,
      loading: false,
      exampleResponse: null,
      showExampleAggregationResponse: false,
      showExampleResultResponse: false,
      aggregationData: null,
      selectedValue: props.selectedValue
    }
    this.getAlerts = this.getAlerts.bind(this)
    this.parseBody = this.parseBody.bind(this)
    this.showResultsOrError = this.showResultsOrError.bind(this)

    this.onExitExampleAggregationResponse = this.onExitExampleAggregationResponse.bind(this)
    this.onShowExampleAggregationResponse = this.onShowExampleAggregationResponse.bind(this)
    this.onExitExampleResultResponse = this.onExitExampleResultResponse.bind(this)
    this.onShowExampleResultResponse = this.onShowExampleResultResponse.bind(this)
  }

  onExitExampleAggregationResponse() {
    this.setState({
      showExampleAggregationResponse: false
    })
  }

  onShowExampleAggregationResponse() {
    this.setState({
      showExampleAggregationResponse: !this.state.showExampleAggregationResponse
    })
  }

  onExitExampleResultResponse() {
    this.setState({
      showExampleResultResponse: false
    })
  }

  onShowExampleResultResponse() {
    this.setState({
      showExampleResultResponse: !this.state.showExampleResultResponse
    })
  }

  sort(a, b) {
    if (a.date > b.date) {
      return 1
    } else if (a.date < b.date) {
      return -1
    } else {
      return 0
    }
  }

  parseBody(body) {
    const data = []
    for (const result of body.aggregations[0].results) {
      const date = new Date(0)
      // The date is in milliseconds provided by Watson
      date.setUTCSeconds(result.key / 1000)
      data.push({
        name: `${leftPad(date.getUTCMonth(), '0', 2)}/${leftPad(date.getUTCDate(), '0', 2)}`,
        amount: result.matching_results,
        date: date})
    }
    const sorted = data.sort(this.sort)
    this.setState({
      loading: false,
      aggregationData: sorted,
      exampleAggregationResponse: body.aggregations,
      exampleResultResponse: body.results
    })
  }

  getAlerts(url) {
    this.setState({loading: true})
    fetch(url)
      .then((res) => res.json())
      .then(this.parseBody)
      .catch((error) => {
        this.setState({
          loading: false,
          error: true})
        console.error(error)
      })
  }

  showResultsOrError() {
    if (this.state.loading) {
      return (<Row><Loader cols={12} /></Row>)
    } else if (this.state.error) {
      return (
        <div>
          <ExampleList selectedValue={this.state.selectedValue} />
          <Row>
            <Col md={12}>
              <Alert type='error-o' color='red'>
                <p className='base--p'>There was an error loading results from Watson, please try again.</p>
              </Alert>
            </Col>
          </Row>
        </div>
      )
    } else if (this.state.exampleResultResponse && this.state.exampleResultResponse.length === 0) {
      return (
        <div>
          <ExampleList selectedValue={this.state.selectedValue} />
          <Row>
            <Col md={12}>
              <Alert type="warning" color="yellow">
                <p className="base--p">There were no results found for this query, please try another example.</p>
              </Alert>
            </Col>
          </Row>
          <Tracking />
        </div>
      )
    } else {
      return (
        <div>
          <ExampleList selectedValue={this.state.selectedValue} />
          <Tracking />
          <Row>
            <Col md={6} mdPush={6}>
              <Row>
                <Col md={12}>
                  <h2>Example visualization of <b>aggregation</b> results</h2>
                  <SimpleLineChart data={this.state.aggregationData} name='Matching articles per day' />
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <JsonLinkInline
                    json={this.state.exampleAggregationResponse}
                    showJson={this.state.showExampleAggregationResponse}
                    onExit={this.onExitExampleAggregationResponse}
                    onShow={this.onShowExampleAggregationResponse}
                    description={<p>Inspect raw aggregation response from Watson&rsquo;s Discovery News used to build the visualization</p>}
                  />
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <JsonLinkInline
                    json={this.state.exampleResultResponse}
                    showJson={this.state.showExampleResultResponse}
                    onExit={this.onExitExampleResultResponse}
                    onShow={this.onShowExampleResultResponse}
                    description={<p>Inspect raw results response from Watson&rsquo;s Discovery News used in the listing of results</p>}
                  />
                </Col>
              </Row>
            </Col>
            <Col md={6} mdPull={6}>
              <h2>Query results</h2>
              <p>These articles are pulled from Watson&rsquo;s Discovery News based on a query and filtering for relevance</p>
              {this.state.exampleResultResponse && this.state.exampleResultResponse.map((result, i) =>
                <div key={i}>
                  <h3>
                    <span className='extra-right-space'>Score: {result.score.toPrecision(2)}</span>
                    <a href={result.url} title={result.title}>{result.title}</a>
                  </h3>
                  <p>Snippets from the article recommended by Watson based on relevance.</p>
                  <ListGroup>
                  {result.blekko.snippet.map((snippet, j) => {
                      if (j < 5) {
                        return (<ListGroupItem key={j}>{snippet}</ListGroupItem>)
                      } else if (j === 5) {
                        return (<ListGroupItem>...</ListGroupItem>)
                      } else {
                        return null
                      }
                    }
                  )}
                  </ListGroup>
                </div>
              )}
            </Col>
          </Row>
        </div>
      )
    }
  }

  render() {
    return this.showResultsOrError()
  }
}
AlertExample.propTypes = {
  match: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  selectedValue: PropTypes.string
}

class NewsAlertExample extends AlertExample {
  constructor(props) {
    props.selectedValue = 'alert'
    super(props)

    this.getNewsAlerts = this.getNewsAlerts.bind(this)
  }

  getNewsAlerts(companyName) {
    const queryString = toQueryString({company_name: companyName})
    this.getAlerts(`/api/1/news-alerts?${queryString}`)
  }

  componentDidMount() {
    const companyName = this.state.params.get('company_name') || 'IBM'
    this.getNewsAlerts(companyName)
  }
}

class EventAlertExample extends AlertExample {
  constructor(props) {
    props.selectedValue = 'event'
    super(props)

    this.getEventAlerts = this.getEventAlerts.bind(this)
  }

  getEventAlerts(industry) {
    const queryString = toQueryString({industry: industry})
    this.getAlerts(`/api/1/event-alerts?${queryString}`)
  }

  componentDidMount() {
    const companyName = this.state.params.get('industry') || '/finance/bank'
    this.getEventAlerts(companyName)
  }
}

export class ExampleList extends Component {
  constructor(props) {
    super(props)

    this.state = {
      selectedValue: props.selectedValue
    }

    this.exampleDescription = this.exampleDescription.bind(this)
    this.handleExampleChange = this.handleExampleChange.bind(this)
  }

  handleExampleChange(value) {
    this.setState({
      selectedValue: value
    })
  }

  exampleDescription() {
    if (this.state.selectedValue === 'alert') {
      return (
        <Col md={6} mdPush={6}>
          <h2>News Alerting</h2>
          <p>Create powerful news alerts by taking advantage of the API&rsquo;s support for entities, concepts, keywords, taxonomies, and sentiment analysis to watch for both news and how it is perceived. This sample news alert query returns news about a company getting upgraded or downgraded by stock analysts.</p>
        </Col>
      )
    } else if (this.state.selectedValue === 'event') {
      return (
        <Col md={6} mdPush={6}>
          <h2>Event Detection</h2>
          <p>Develop innovative event detection applications by leveraging the API&rsquo;s support for subject, action, and object relationship extraction and checking for terms and actions such as &quot;acquisition&quot;, &quot;election results&quot;, or &quot;IPO&quot;. This sample event detection query returns technology company aquisitions.</p>
        </Col>
      )

    } else {
      return (
        <Col md={6} mdPush={6}>
          <h2>Discovery News Alerts and Events</h2>
          <p>These example queries use Watson&rsquo;s Discovery News Alerts to find relevant articles for different business purposes.</p>
        </Col>
      )
    }
  }

  render() {
    return (
      <Row>
        {this.exampleDescription()}
        <Col md={6} mdPull={6}>
          <Row>
            <Col md={12}>
              <h2>Example Queries</h2>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <RadioGroup
                tabStyle={true}
                selectedValue={this.state.selectedValue}
                onChange={this.handleExampleChange}>
                <Radio
                  className='fullWidth'
                  value='alert'>
                  News alerts for a company being upgraded or downgraded by stock analysts:
                  <form action='/example/news-alert'>
                    <Row>
                      <Col md={9}>
                        <TextInput
                          placeholder='IBM'
                          id='alertCompanyName'
                          name='company_name'
                          returnKeyType='search'
                          keyboardAppearance='dark'
                          autoCapitalize='none'
                          onFocus={() => this.handleExampleChange('alert') }
                        />
                      </Col>
                      <Col md={3}>
                        <button type='submit'><Icon type="right" /></button>
                      </Col>
                    </Row>
                  </form>
                </Radio>
                <Radio
                  className='fullWidth'
                  value='event'>
                  Event alerts for company aquisitions in the industry:
                  <form action='/example/event-alert'>
                    <Row>
                      <Col md={9}>
                        <TextInput
                          placeholder='/finance/bank'
                          id='eventCompanyName'
                          name='industry'
                          returnKeyType='search'
                          keyboardAppearance='dark'
                          autoCapitalize='none'
                          onFocus={() => this.handleExampleChange('event') }
                        />
                      </Col>
                      <Col md={3}>
                        <button type='submit'><Icon type="right" /></button>
                      </Col>
                    </Row>
                  </form>
                </Radio>
              </RadioGroup>
            </Col>
          </Row>
        </Col>
      </Row>
    )
  }
}
ExampleList.propTypes = {
  selectedValue: PropTypes.string
}

export class Example extends Component {
  constructor(props) {
    super(props)
    this.state = {
      match: props.match
    }
  }

  render() {
    return (
      <div>
        <Header
          mainBreadcrumbs='Discovery News'
          mainBreadcrumbsUrl='/'
          subBreadcrumbs='Examples'
          subBreadcrumbsUrl='/example'
          hasWordmark={true} />
        <Grid>
          <Router>
            <Switch>
              <Route exact path={this.state.match.url} component={ExampleList} />
              <Route path={`${this.state.match.url}/news-alert`} component={NewsAlertExample} />
              <Route path={`${this.state.match.url}/event-alert`} component={EventAlertExample} />
            </Switch>
          </Router>
        </Grid>
        <Footer />
      </div>
    )
  }
}
Example.propTypes = {
  match: PropTypes.object.isRequired
}
