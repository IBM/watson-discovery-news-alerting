import React, { Component } from 'react'
import { Row, Col } from 'react-bootstrap'
import { TextInput } from 'watson-react-components/dist/components'
import 'whatwg-fetch'

export class Tracking extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: false
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
        query: 'news-alerts',
        frequency: 'daily'
      })
    }
    fetch('/api/1/tracking', params)
      .then((res) => res.json())
      .then(console.log)
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
          <button onClick={this.formSubmit}>Track</button>
        </Col>
      </Row>
    )
  }
}
Tracking.propTypes = {
}
