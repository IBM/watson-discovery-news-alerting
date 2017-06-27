import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

import registerServiceWorker from './registerServiceWorker'
import './index.css'

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>, document.getElementById('root'))

// Service worker used to allow the pages to work in ~offline mode
registerServiceWorker()
