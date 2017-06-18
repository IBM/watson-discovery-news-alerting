import React, { Component } from 'react'
import { Table, Grid, Row, Col } from 'react-bootstrap'
import { Route, Switch } from 'react-router-dom'
import { Header, Footer, Icon, ButtonsGroup } from 'watson-react-components/dist/components'
import PropTypes from 'prop-types'
import 'whatwg-fetch'

export class Subscription extends Component {
  constructor(props) {
    super(props)

    this.state = {
      error: false,
      loading: false,
      subscription: props.subscription,
      unsubscribed: false,
      updatingSlack: false,
      updatingEmail: false,
      token: props.token
    }

    this.unsubscribe = this.unsubscribe.bind(this)
    this.handleUnsubscribe = this.handleUnsubscribe.bind(this)
    this.handleDestinationChange = this.handleDestinationChange.bind(this)
    this.changeDeliveryMethods = this.changeDeliveryMethods.bind(this)
  }

  unsubscribe() {
    this.setState({loading: true})

    const token = this.state.token
    const id = this.state.subscription._id

    const params = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }

    fetch(`/api/1/subscription/${token}/unsubscribe/${id}/`, params)
      .then(() => {
        this.setState({
          loading: false,
          unsubscribed: true})
      })
      .catch((error) => {
        this.setState({error: true})
        console.error(error)
      })
  }

  changeDeliveryMethods(email, slack) {
    const token = this.state.token
    const id = this.state.subscription._id
    const updatedSubscription = this.state.subscription

    if (email) {
      updatedSubscription.destinationEmail = ! updatedSubscription.destinationEmail
      this.setState({updatingEmail: true})
    }

    if (slack) {
      updatedSubscription.destinationSlack = ! updatedSubscription.destinationSlack
      this.setState({updatingSlack: true})
    }
    this.setState({subscription: updatedSubscription})

    const params = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        destinationSlack: updatedSubscription.destinationSlack,
        destinationEmail: updatedSubscription.destinationEmail
      })
    }
    fetch(`/api/1/subscription/${token}/destination/${id}/`, params)
      .then(() => {
        if (email) {
          this.setState({updatingEmail: false})
        }

        if (slack) {
          this.setState({updatingSlack: false})
        }
      })
      .catch((error) => {
        this.setState({error: true})
        console.error(error)
      })
  }

  handleDestinationChange(e) {
    const value = e.target.value

    const updatingSlack = value === 'slack'
    const updatingEmail = value === 'email'

    this.changeDeliveryMethods(updatingEmail, updatingSlack)
  }

  handleUnsubscribe(e) {
    e.preventDefault()

    this.unsubscribe()
  }

  render() {
    return (
      <tr>
        <td>
          <span>{this.state.subscription.query}</span>
        </td>
        <td>
          <span>{this.state.subscription.frequency}</span>
        </td>
        <td>
          <ButtonsGroup
            type='checkbox'
            name='destination'
            onChange={this.handleDestinationChange}
            buttons={
              [
                {
                  value: 'slack',
                  id: `slack-${this.state.subscription._id}`,
                  text: this.state.updatingSlack ? 'Saving' : 'Slack',
                  selected: this.state.subscription.destinationSlack
                },
                {
                  value: 'email',
                  id: `email-${this.state.subscription._id}`,
                  text: this.state.updatingEmail ? 'Saving' : 'Email',
                  selected: this.state.subscription.destinationEmail
                }
              ]
            }
          />
        </td>
        <td>
          <button disabled={this.state.loading || this.state.unsubscribed} onClick={this.handleUnsubscribe}>{this.state.loading ? (<span><Icon type="loader" size="small" />loading...</span>) : (this.state.unsubscribed ? (<span>unsubscribed</span>) : (<span>unsubscribe</span>))}</button>
        </td>
      </tr>
    )
  }
}
Subscription.propTypes = {
  subscription: PropTypes.object.isRequired,
  token: PropTypes.string.isRequired
}

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


  renderLoader() {
    return (
      <div className='center-block center-text'>
        <Icon type="loader" size="large" />
        <p>Loading subscriptions...</p>
      </div>
    )
  }

  renderResults() {
    return (
      <Table>
        <thead>
          <tr>
            <th>Alert Type</th>
            <th>Frequency</th>
            <th>Destination</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(this.state.subscriptions && this.state.subscriptions.length > 0) ? this.state.subscriptions.map((subscription, i) =>
            <Subscription subscription={subscription} token={this.state.token} key={i} />
            ) : (
              <tr>
                <td colSpan={4}>You&rsquo;re currently not subscribed to any alerts, <a href='/' title='add some'>subscribe to some.</a></td>
              </tr>
            )}
        </tbody>
      </Table>
    )
  }

  render() {
    return (
      <Row>
        <Col md={12}>
          {this.state.loading ? this.renderLoader() : this.renderResults()}
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
