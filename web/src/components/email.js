import React, { Component } from 'react'
import { Route, Switch } from 'react-router-dom'
import PropTypes from 'prop-types'

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
        color: '#aeaeae',
        borderBottom: '2px solid #aeaeae',
        backgroundColor: '#323232',
        fontWeight: '700',
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
              <a href={this.state.baseUrl} style={this.styles().highlight}>Discovery News Alerting</a><span style={this.styles().midlight}> / </span><a href={`${this.state.baseUrl}/example/${match.params.alertType}`} style={this.styles().midlight}>{match.params.alertType}</a>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="2">
              <h2>Query results</h2>
            </td>
          </tr>
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
                          <a href={result.url} title={result.title} style={this.styles().titlelink}>{result.title.length > 40 ? (
                            <span>{result.title.slice(0, 40)}...</span>
                          ) : (
                            <span>{result.title}</span>
                          )}</a>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.blekko.snippet.map((snippet, j) => {
                        return (
                          <tr key={j}>
                            <td colSpan="2">
                              {snippet}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )
              })}
            </td>
          </tr>
          <tr style={ {backgroundColor: '#323232', padding: '15px'} }>
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
