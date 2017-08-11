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

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Grid, Row, Col } from 'react-bootstrap'
import { Header, Footer, Icon } from 'watson-react-components/dist/components'
import { Route, Switch } from 'react-router-dom'

import { BrandAlerts, ProductAlerts, RelatedBrands, PositiveProductAlerts, StockAlerts } from './track'
import { BRAND_ALERTS, PRODUCT_ALERTS, RELATED_BRANDS, POSITIVE_PRODUCT_ALERTS, STOCK_ALERTS } from '../watson/constants'

// TODO rename

export class ExampleList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      // List of the available alerts, this could be moved to the DB and use a generic alert instead of a custom component for each. The
      // reason for the custom component is so that each one can have a different style.
      examples: [
        {
          header: 'Brand Alerts',
          url: `/track/${BRAND_ALERTS}/`,
          body: (
            <p>Search news for mentions of your brand name and enrich the results with information provided by Watson&rsquo;s Discovery Service. Be at the forefront of the market by tracking you brand in the news.</p>)
        },
        {
          header: 'Product Alerts',
          url: `/track/${PRODUCT_ALERTS}/`,
          body: (
            <p>During a product&rsquo;s life-cycle, monitor the news for mentions of the product and receive enriched information from Watson on how the product is doing in the news. Watch for early indicators of how a product in performing by tracking it in the news.</p>
          )
        },
        {
          header: 'Related Brands',
          url: `/track/${RELATED_BRANDS}/`,
          body: (
            <p>Receiving timely updates on competitive brands open new business avenues to investigate. Receive insight on how their new products are being received in the news and use the information to drive business change.</p>
          )
        },
        {
          header: 'Positive Product Alerts',
          url: `/track/${POSITIVE_PRODUCT_ALERTS}/`,
          body: (
            <p>Knowing when a product is succeeding drives further improvements. Keeping track of positive news articles about a product with enriched details from Watson give the insight required to push a products success.</p>
          )
        },
        {
          header: 'Stock Alerts',
          url: `/track/${STOCK_ALERTS}/`,
          body: (
            <p>Markets change quickly when news breaks, using Watson you can keep track of early warning signs of your stocks being upgraded or downgraded by experts.</p>
          )
        }
      ]
    }
  }

  // TODO consider moving this into a separate component
  // Renders an alert's description and a small header
  renderExample(example, i) {
    return (
      <Col md={4} key={i}>
        <div className='example'>
          <h2><a href={example.url}>{example.header}</a></h2>
          {example.body}
        </div>
        <Row>
          <Col md={2} mdOffset={8} xs={3} xsOffset={8}>
            <button
              className='input-inherit input-with-button--button'
              onClick={() => window.location.href = example.url}
            >
              <h3>Track<Icon type='right' /></h3>
            </button>
          </Col>
        </Row>
      </Col>
    )
  }

  // Produces a list of the examples in a grid of 3xN
  render() {
    // The complex reduce function is done to distribute the examples into an array of arrays where each array is at most {gridWidth}
    // length
    return (
      <div>
        {this.state.examples && this.state.examples.reduce((acc, example, i) => {
          const gridWidth = 3
          const chunkSize = Math.floor(i / gridWidth)

          if (!acc[chunkSize]) {
            acc[chunkSize] = []
          }

          acc[chunkSize].push(example)

          return acc
        }, []).map((exampleRow, i) => (
          <Row key={i}>
            {exampleRow.map((example, j) => this.renderExample(example, j))}
          </Row>
          ))
        }
      </div>
    )
  }
}

// This is the main page being routed to the homepage / and tracking page /track
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
          subBreadcrumbs='Tracking'
          subBreadcrumbsUrl='/track'
          hasWordmark={true} />
        <Grid>
          <Switch>
            <Route exact path={this.state.match.url} component={ExampleList} />
            <Route path={`${this.state.match.url}/${BRAND_ALERTS}/`} component={BrandAlerts} />
            <Route path={`${this.state.match.url}/${PRODUCT_ALERTS}/`} component={ProductAlerts} />
            <Route path={`${this.state.match.url}/${RELATED_BRANDS}/`} component={RelatedBrands} />
            <Route path={`${this.state.match.url}/${POSITIVE_PRODUCT_ALERTS}/`} component={PositiveProductAlerts} />
            <Route path={`${this.state.match.url}/${STOCK_ALERTS}/`} component={StockAlerts} />
          </Switch>
        </Grid>
        <Footer />
      </div>
    )
  }
}
Example.propTypes = {
  match: PropTypes.object.isRequired
}
