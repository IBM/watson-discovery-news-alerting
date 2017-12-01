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
import { Row, Col } from 'react-bootstrap'
import PropTypes from 'prop-types'
import { TextInput, Alert, Icon, ArrowBox, Colors } from 'watson-react-components/dist/components'
import 'whatwg-fetch'

// Logic to signup for email tracking from the website
export class Tracking extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: false,
      error: false,
      tracking: false,
      emailValid: false,
      emailInvalid: null,
      email: null,
      frequency: 'daily',
      query: props.query,
      keyword: props.keyword
    }

    this.createTracking = this.createTracking.bind(this)
    this.formSubmit = this.formSubmit.bind(this)
    this.emailChanged = this.emailChanged.bind(this)
    this.frequencyChanged = this.frequencyChanged.bind(this)
  }

  createTracking() {
    this.setState({loading: true})
    const params = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: this.state.email,
        query: this.state.query,
        keyword: this.state.keyword,
        frequency: this.state.frequency
      })
    }
    fetch('/api/1/subscription/', params)
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

  emailChanged(e) {
    const value = e.target.value

    // This is the RFC 5322 email regex from http://emailregex.com/
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    // This won't check if the email can actually receive emails though
    if (value && value.match(emailRegex)) {
      this.setState({emailValid: true, emailInvalid: false})
    }

    this.setState({email: value})
  }

  formSubmit(e) {
    e.preventDefault()

    if (this.state.emailValid) {
      console.log('Email is valid.')
      this.createTracking()
    } else {
      console.error('Invalid email was sent.')
      this.setState({emailInvalid: true})
    }
  }

  frequencyChanged(e) {
    const value = e.target.value

    if (value) {
      this.setState({frequency: value})
    }
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
            <ArrowBox
              direction="bottom"
              show={this.state.emailInvalid}
              color={Colors.red_50}
              icon="error"
              >
                <p className="base--p">
                A valid email address is required to track these alerts.
                </p>
            </ArrowBox>
            <TextInput
              id='emailAddress'
              name='emailAddress'
              placeholder='Email address'
              disabled={this.state.loading}
              onInput={this.emailChanged}
            />
          </Col>
          <Col md={3}>
            <select name='frequency' value={this.state.frequency} onChange={this.frequencyChanged} className={this.state.frequencyClass}>
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
  query: PropTypes.string.isRequired,
  keyword: PropTypes.string.isRequired
}
