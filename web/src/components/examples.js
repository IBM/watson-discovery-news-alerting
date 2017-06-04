import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts/lib'
import { Row, Col } from 'react-bootstrap'
import { Icon, TextInput, Radio, RadioGroup, JsonLinkInline } from 'watson-react-components/dist/components'

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

class QueryWithExamples extends Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedValue: null,
      selectedQuery: '',
      exampleResponse: null,
      showExampleResponse: false,
      aggregationData: null,
      loading: false
    }

    this.handleExampleChange = this.handleExampleChange.bind(this)
    this.queryForExample = this.queryForExample.bind(this)

    this.onExitExampleResponse = this.onExitExampleResponse.bind(this)
    this.onShowExampleResponse = this.onShowExampleResponse.bind(this)
  }

  onExitExampleResponse() {
    this.setState({
      showExampleResponse: false
    })
  }

  onShowExampleResponse() {
    this.setState({
      showExampleResponse: !this.state.showExampleResponse
    })
  }

  queryForExample(example) {
    var query = null
    switch(example) {
      case 'alert': {
        const queryString = toQueryString({company_name: 'IBM'})
        this.setState({loading: true})
        fetch(`/api/1/news-alerts?${queryString}`)
          .then((res) => {
            res.json()
              .then((body) => {
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
                const sorted = data.sort((a, b) => {
                  if (a.date > b.date) {
                    return 1
                  } else if (a.date < b.date) {
                    return -1
                  } else {
                    return 0
                  }
                })
                this.setState({
                  loading: false,
                  selectedQuery: body.matching_results,
                  aggregationData: sorted,
                  exampleResponse: body.aggregations})
              })
          })
          .catch(console.error)
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
              <Radio className='fullWidth' value='alert'>News alerts for a company being upgraded or downgraded by stock analysts: <TextInput placeholder='IBM' id='alertCompanyName' onFocus={() => this.handleExampleChange('alert') }/></Radio>
              <Radio className='fullWidth' value='event'>Event alerts for company aquisitions in the industry: <TextInput placeholder='/finance/bank' id='eventCompanyName' onFocus={() => this.handleExampleChange('event') }/></Radio>
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
        <Row>
          <Col md={12}>
            {this.state.loading &&
              <Icon type="loader" size="large" />
            }
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            {this.state.exampleResponse &&
              <div>
                <JsonLinkInline
                  json={this.state.exampleResponse}
                  showJson={this.state.showExampleResponse}
                  onExit={this.onExitExampleResponse}
                  onShow={this.onShowExampleResponse}
                  description={<p>Example Response</p>}
                />
                <SimpleLineChart data={this.state.aggregationData} name='News' />
              </div>
            }
          </Col>
        </Row>
      </div>
    )
  }
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
       <Line name={this.state.name} type='monotone' dataKey='amount' stroke='#8884d8' activeDot={{r: 8}}/>
      </LineChart>
    )
  }
}
SimpleLineChart.propTypes = {
  name: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired
}

export class Example extends Component {
  render() {
    return (
      <Row>
        <Col md={6}>
          <QueryWithExamples />
        </Col>
        <Col md={6}>
          <h2>Discovery News Alerts and Events</h2>
          <p>TODO further describe in detail the usage of these example queries and how they may be expanded upon for new discoveries.</p>
        </Col>
      </Row>
    )
  }
}
