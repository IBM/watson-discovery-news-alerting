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
import { Route, Switch } from 'react-router-dom'
import PropTypes from 'prop-types'

// NOTE this is used to render emails and as such only certain features of HTML/CSS are available (no JS)
export class Email extends Component {
  constructor(props) {
    super(props)
    this.state = {
      baseUrl: props.baseUrl || '/',
      results: props.results,
      oneTimeCode: props.oneTimeCode
    }

    this.body = this.body.bind(this)
  }

  styles() {
    return {
      header: {
        color: '#121212'
      },
      highlight: {
        color: '#9855d4',
        fontWeight: '700'
      },
      midlight: {
        color: '#777677',
        fontWeight: '400'
      },
      footer: {
        color: '#9855d4',
        borderBottom: '1px solid #9855d4',
        //backgroundColor: '#323232',
        fontWeight: '400',
        marginRight: '25px',
        marginLeft: '25px'
      },
      titlelink: {
        color: '#777677',
        fontWeight: '400'
      }
    }
  }

  body({match}) {
    return (
      <table style={ {width: '100%', fondFamily: 'sans-serif'} }>
        <thead>
          <tr>
            <th>
              <h2 style={this.styles().header}>Watson</h2>
            </th>
            <th>
              <a href={this.state.baseUrl} style={this.styles().highlight}>Discovery News Alerting</a><span style={this.styles().midlight}> / </span><a href={`${this.state.baseUrl}/track`} style={this.styles().midlight}>{match.params.alertType}</a>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="2">
              <p>These articles are pulled from Watson&rsquo;s Discovery News based on a query and filtering for relevance</p>
            </td>
          </tr>
          <tr>
            <td colSpan="2">
              {this.state.results.map((result, i) => {
                return (
                  <table key={i} style={ {width: '100%'} }>
                    <thead>
                      <tr>
                        <th style={ {color: '#9855d4'} }>
                        Score: {result.score.toPrecision(2)}
                        </th>
                        <th>
                          <a href={result.url} title={result.title} style={this.styles().titlelink}>{result.title.length > 60 ? (
                            <span>{result.title.slice(0, 60)}...</span>
                          ) : (
                            <span>{result.title}</span>
                          )}</a>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan='2'>
                          <p>{result.alchemyapi_text}</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )
              })}
            </td>
          </tr>
          <tr style={ {padding: '15px'} }>
            <td>
              <a href='http://www.ibm.com/legal/us/en/' style={this.styles().footer}>Terms</a>
              <a href='http://www.ibm.com/privacy/us/en/' style={this.styles().footer}>Privacy</a>
            </td>
            <td>
              <a href={`${this.state.baseUrl}/subscription/${this.state.oneTimeCode}/`} style={this.styles().footer}>Manage Subscriptions / Unsubscribe</a>
            </td>
          </tr>
        </tbody>
      </table>
    )
  }

  render() {
    return (
      <Switch>
        <Route path='/:alertType' component={this.body} />
      </Switch>
    )
  }
}
Email.propTypes = {
  baseUrl: PropTypes.string.isRequired,
  results: PropTypes.array.isRequired,
  oneTimeCode: PropTypes.string.isRequired
}
