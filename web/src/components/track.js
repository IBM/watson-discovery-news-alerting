import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts/lib'
import { Row, Col } from 'react-bootstrap'
import { InputWithButton, Icon, Alert, JsonLinkInline } from 'watson-react-components/dist/components'
import { Tracking } from './tracking'

import { BRAND_ALERTS, PRODUCT_ALERTS, RELATED_BRANDS, POSITIVE_PRODUCT_ALERTS, STOCK_ALERTS } from '../watson/constants'

// Taken from https://github.com/github/fetch/issues/256
function toQueryString(params) {
  return Object.keys(params)
      .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
      .join('&')
}

// Taken from https://stackoverflow.com/a/36247412/1589147
const leftPad = (s, c, n) => {
  s = s.toString()
  c = c.toString()
  return s.length > n ? s : c.repeat(n - s.length) + s
}

// This is a default example of using recharts, it's a well documented project and easy to implement with Watson aggregations
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

// This is the generic alert, it doesn't render much of anything and is primarily used as a basis for shared code which is executed for each
// type of alert (Brand Alert, Product Alert, Related Brands...)
class AlertExample extends Component {
  constructor(props) {
    super(props)

    this.state = {
      match: props.match,
      params: new URLSearchParams(props.location.search),  // In this version of React Router, it doesn't parse QSP
      error: false,
      loading: false,
      exampleResponse: null,
      showExampleAggregationResponse: false,
      showExampleResultResponse: false,
      aggregationData: null
    }
    this.getAlerts = this.getAlerts.bind(this)
    this.parseBody = this.parseBody.bind(this)
    this.showResultsOrError = this.showResultsOrError.bind(this)
    this.renderSearchBox = this.renderSearchBox.bind(this)

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

  // Sort each article returned by its date in the aggregation results, this is used to make the chart legible.
  // TODO move to the chart code
  sort(a, b) {
    if (a.date > b.date) {
      return 1
    } else if (a.date < b.date) {
      return -1
    } else {
      return 0
    }
  }

  // The response is in the correct format for display in list for but the aggregations need the dates converted back from strings.
  parseBody(body) {
    const data = []
    for (const result of body.aggregations[0].results) {
      const date = new Date(0)
      // The date is in milliseconds provided by Watson, NOTE milliseconds!
      date.setUTCSeconds(result.key / 1000)
      data.push({
        name: `${leftPad(date.getUTCMonth(), '0', 2)}/${leftPad(date.getUTCDate(), '0', 2)}`,  // Change the date format to be MM/DD
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

  renderSearchBox() {
    return (
      <Row>
        <Col md={12}>
          <h1>Enter Search</h1>
        </Col>
      </Row>
    )
  }

  // TODO Instead of doing the big if/elses here, it'd be preferable to separate into different components so that it's easier to debug when
  // certain state issues occur
  showResultsOrError() {
    if (this.state.loading) {
      return (<Row><Loader cols={12} /></Row>)
    } else if (this.state.error) {
      return (
        <div>
          <Row>
            <Col md={12}>
              <Alert type='error-o' color='red'>
                <p className='base--p'>There was an error loading results from Watson, please try again.</p>
              </Alert>
            </Col>
          </Row>
          {this.renderSearchBox()}
        </div>
      )
    } else if (this.state.exampleResultResponse && this.state.exampleResultResponse.length === 0) {
      return (
        <div>
          <Row>
            <Col md={12}>
              <Alert type="warning" color="yellow">
                <p className="base--p">There were no results found for this query, please try another keyword.</p>
              </Alert>
            </Col>
          </Row>
          {this.renderSearchBox()}
          <Tracking query={this.state.query} keyword={this.state.keyword}  />
        </div>
      )
    } else if(this.state.keyword === null || typeof this.state.keyword === 'undefined' || this.state.keyword === '') {
      // This is primarily to avoid using == to check the keyword == null
      return this.renderSearchBox()
    } else {
      return (
        <div>
          {this.renderSearchBox()}
          <Tracking query={this.state.query} keyword={this.state.keyword}  />
          <Row>
            <Col md={6} mdPush={6}>
              <Row>
                <Col md={12}>
                  <h2>Visualization of <b>aggregation</b> results</h2>
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
              <h2>Results</h2>
              <p>These articles are pulled from Watson&rsquo;s Discovery News based on a query and filtering for relevance</p>
              {this.state.exampleResultResponse && this.state.exampleResultResponse.map((result, i) =>
                <div key={i}>
                  <h3>
                    <span className='extra-right-space'>Score: {result.score.toPrecision(2)}</span>
                    <a href={result.url} title={result.title}>{result.title}</a>
                  </h3>
                  <p>{result.alchemyapi_text}</p>
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
  location: PropTypes.object.isRequired
}

export class BrandAlerts extends AlertExample {
  constructor(props) {
    super(props)

    const brandName = this.state.params.get('brand_name')
    this.state.query = BRAND_ALERTS
    this.state.keyword = brandName

    this.getBrandAlerts = this.getBrandAlerts.bind(this)
    this.renderSearchBox = this.renderSearchBox.bind(this)
  }

  getBrandAlerts(brandName) {
    const queryString = toQueryString({brand_name: brandName})
    this.getAlerts(`/api/1/track/${BRAND_ALERTS}/?${queryString}`)
  }

  renderSearchBox() {
    return (
      <div>
        <Row>
          <Col md={12}>
            <h1>Brand Alerts</h1>
            <p>Watson will search the latest news for updates related to your brand, enter your brand&rsquo;s name to begin.</p>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <form method='GET'>
              <InputWithButton
                name='brand_name'
                placeholder={this.state.keyword || 'Your Brand Name' }
              />
            </form>
          </Col>
        </Row>
      </div>
    )
  }

  componentDidMount() {
    if (this.state.keyword) {
      this.getBrandAlerts(this.state.keyword)
    }
  }
}

export class ProductAlerts extends AlertExample {
  constructor(props) {
    super(props)

    const productName = this.state.params.get('product_name')
    this.state.query = PRODUCT_ALERTS
    this.state.keyword = productName

    this.getProductAlerts = this.getProductAlerts.bind(this)
    this.renderSearchBox = this.renderSearchBox.bind(this)
  }

  getProductAlerts(productName) {
    const queryString = toQueryString({product_name: productName})
    this.getAlerts(`/api/1/track/${PRODUCT_ALERTS}/?${queryString}`)
  }

  renderSearchBox() {
    return (
      <div>
        <Row>
          <Col md={12}>
            <h1>Product Alerts</h1>
            <p>Watson will search the latest news for updates related to your product, enter your product&rsquo;s name to begin.</p>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <form method='GET'>
              <InputWithButton
                name='product_name'
                placeholder={this.state.keyword || 'Your Product Name'}
              />
            </form>
          </Col>
        </Row>
      </div>
    )
  }

  componentDidMount() {
    if (this.state.keyword) {
      this.getProductAlerts(this.state.keyword)
    }
  }
}

export class RelatedBrands extends AlertExample {
  constructor(props) {
    super(props)

    const brandName = this.state.params.get('brand_name')
    this.state.query = RELATED_BRANDS
    this.state.keyword = brandName

    this.getRelatedBrandsAlerts = this.getRelatedBrandsAlerts.bind(this)
    this.renderSearchBox = this.renderSearchBox.bind(this)
  }

  getRelatedBrandsAlerts(brandName) {
    const queryString = toQueryString({brand_name: brandName})
    this.getAlerts(`/api/1/track/${RELATED_BRANDS}/?${queryString}`)
  }

  renderSearchBox() {
    return (
      <div>
        <Row>
          <Col md={12}>
            <h1>Related Brands</h1>
            <p>Watson will search the latest news for updates related to your brand and use those articles to discover brands in the same industry as yours. Enter your brand&rsquo;s name to begin.</p>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <form method='GET'>
              <InputWithButton
                name='brand_name'
                placeholder={this.state.keyword || 'Your Brand Name'}
              />
            </form>
          </Col>
        </Row>
      </div>
    )
  }

  componentDidMount() {
    if (this.state.keyword) {
      this.getRelatedBrandsAlerts(this.state.keyword)
    }
  }
}

export class PositiveProductAlerts extends AlertExample {
  constructor(props) {
    super(props)

    const productName = this.state.params.get('product_name')
    this.state.query = POSITIVE_PRODUCT_ALERTS
    this.state.keyword = productName

    this.getPositiveProductAlerts = this.getPositiveProductAlerts.bind(this)
    this.renderSearchBox = this.renderSearchBox.bind(this)
  }

  getPositiveProductAlerts(productName) {
    const queryString = toQueryString({product_name: productName})
    this.getAlerts(`/api/1/track/${POSITIVE_PRODUCT_ALERTS}/?${queryString}`)
  }

  renderSearchBox() {
    return (
      <div>
        <Row>
          <Col md={12}>
            <h1>Positive Product Alerts</h1>
            <p>Watson will search the latest news for updates related to your product and include only the positive news articles. Enter your product&rsquo;s name to begin.</p>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <form method='GET'>
              <InputWithButton
                name='product_name'
                placeholder={this.state.keyword || 'Your Product Name'}
              />
            </form>
          </Col>
        </Row>
      </div>
    )
  }

  componentDidMount() {
    if (this.state.keyword) {
      this.getPositiveProductAlerts(this.state.keyword)
    }
  }
}

export class StockAlerts extends AlertExample {
  constructor(props) {
    super(props)

    const stockSymbol = this.state.params.get('stock_symbol')
    this.state.query = STOCK_ALERTS
    this.state.keyword = stockSymbol

    this.getStockAlerts = this.getStockAlerts.bind(this)
    this.renderSearchBox = this.renderSearchBox.bind(this)
  }

  getStockAlerts(stockSymbol) {
    const queryString = toQueryString({stock_symbol: stockSymbol})
    this.getAlerts(`/api/1/track/${STOCK_ALERTS}/?${queryString}`)
  }

  renderSearchBox() {
    return (
      <div>
        <Row>
          <Col md={12}>
            <h1>Stock Alerts</h1>
            <p>Monitor news articles for stock upgrade or downgrade events which may highlight a shift in market confidence towards your brand.</p>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <form method='GET'>
              <InputWithButton
                name='stock_symbol'
                placeholder={this.state.keyword || 'Your Stock Ticker Symbol'}
              />
            </form>
          </Col>
        </Row>
      </div>
    )
  }

  componentDidMount() {
    if (this.state.keyword) {
      this.getStockAlerts(this.state.keyword)
    }
  }
}
