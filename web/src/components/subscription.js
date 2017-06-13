import React, { Component } from 'react'
import { Grid, Row, Col } from 'react-bootstrap'
import { Route, Switch } from 'react-router-dom'
import { Header, Footer } from 'watson-react-components/dist/components'
import PropTypes from 'prop-types'
import 'whatwg-fetch'

export class SubscriptionList extends Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: false,
      error: false,
      token: props.match.params.token,
      subscriptions: []
    }

    this.getSubscriptions = this.getSubscriptions.bind(this)
  }

  getSubscriptions() {
    this.setState({loading: true})
    const params = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
    fetch(`/api/1/subscription/${this.state.token}/`, params)
      .then((res) => res.json())
      .then((res) => {
        const subscriptions = res.docs
        this.setState({
          loading: false,
          subscriptions: subscriptions
        })
      })
      .catch((error) => {
        console.error(error)
        this.setState({
          loading: false,
          error: true
        })
      })
  }

  componentDidMount() {
    this.getSubscriptions()
  }

  render() {
    return (
      <Row>
        <Col md={12}>
          {this.state.subscriptions && this.state.subscriptions.map((subscription, i) =>
            <Row key={i}>
              <Col md={12}>
                <p>{subscription.query} {subscription._id} {subscription.frequency}</p>
              </Col>
            </Row>
          )}
        </Col>
      </Row>
    )
  }
}
SubscriptionList.propTypes = {
  match: PropTypes.object.isRequired
}

export class CurrentSubscriptions extends Component {
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
          subBreadcrumbs='Subscriptions'
          subBreadcrumbsUrl=''
          hasWordmark={true} />
        <Grid>
          <Switch>
            <Route path={`${this.state.match.url}/:token`} component={SubscriptionList} />
          </Switch>
        </Grid>
        <Footer />
      </div>
    )
  }
}
CurrentSubscriptions.propTypes = {
  match: PropTypes.object.isRequired
}
