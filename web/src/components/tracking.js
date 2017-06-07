import React, { Component } from 'react'
import { Row, Col } from 'react-bootstrap'
import PropTypes from 'prop-types'
import { TextInput, Alert, Icon } from 'watson-react-components/dist/components'
import 'whatwg-fetch'

export class Tracking extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: false,
      error: false,
      tracking: false,
      query: props.query
    }

    this.createTracking = this.createTracking.bind(this)
    this.formSubmit = this.formSubmit.bind(this)
  }

  createTracking() {
    this.setState({loading: true})
    const params = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        query: this.state.query,
        frequency: 'daily'
      })
    }
    fetch('/api/1/tracking', params)
      .then((res) => res.json())
      .then(() => {
        this.setState({tracking: true})
      })
      .catch((error) => {
        console.error(error)
        this.setState({
          loading: false,
          error: true
        })
      })
  }

  formSubmit(e) {
    e.preventDefault()
    this.createTracking()
  }

  render() {
    if (this.state.tracking) {
      return (
        <Row>
          <Col md={12}>
            <Alert type='success' color='green'>
              <p className='base--p'>You will now receive updates whenever results for this query have changed.</p>
            </Alert>
          </Col>
        </Row>
      )
    } else if (this.state.error) {
      return (
        <Row>
          <Col md={12}>
            <Alert type='error-o' color='red'>
              <p className='base--p'>There was an error while trying to track these results, please try again.</p>
            </Alert>
          </Col>
        </Row>
      )
    } else {
      return (
        <Row>
          <Col md={3}>
            <p>Receive alerts when these results change:</p>
          </Col>
          <Col md={3}>
            <TextInput
              id='emailAddress'
              name='emailAddress'
              placeholder='Email address'
              disabled={this.state.loading}
            />
          </Col>
          <Col md={3}>
            <select name='frequency'>
              <option>daily</option>
              <option>weekly</option>
              <option>monthly</option>
            </select>
          </Col>
          <Col md={3}>
            <button disabled={this.state.loading} onClick={this.formSubmit}>{!this.state.loading ? 'Track' : (<Icon type='loader' size='small' />)}</button>
          </Col>
        </Row>
      )
    }
  }
}
Tracking.propTypes = {
  query: PropTypes.string.isRequired
}
