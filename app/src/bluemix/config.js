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

require('dotenv').config({
  silent: true
});

import Cloudant from '@cloudant/cloudant'

// Wrapper to get the Cloudant service
export function getCloudantService() {

  var credentials = {
    use_iam: false,
    iam_apikey: '',
    iam_username: '',
    username: '',
    password: ''
  }

  if (typeof process.env.CLOUDANT_IAM_APIKEY !== 'undefined' && process.env.CLOUDANT_IAM_APIKEY !== '<add_cloudant_iam_apikey>') {
    // use IAM creds
    credentials.use_iam = true
    credentials.iam_apikey = process.env.CLOUDANT_IAM_APIKEY
    credentials.iam_username = process.env.CLOUDANT_IAM_USERNAME
    console.log("credentials.iam_apikey: " + credentials.iam_apikey)
    console.log("credentials.iam_username: " + credentials.iam_username)
  } else {
    credentials.username = process.env.CLOUDANT_USERNAME
    credentials.password = process.env.CLOUDANT_PASSWORD
    console.log("credentials.username: " + credentials.username)
    console.log("credentials.password: " + credentials.password)
  }

  if (credentials.use_iam) {
    // use IAM creds
    var cloudant = new Cloudant({
      account: credentials.iam_username,
      plugins: [
        'promises',
        {
          iamauth: {
            iamApiKey: credentials.iam_apikey
          }
        }
      ],
      plugin: 'promises'  // Using the promises plugin to allow use of async/await
    })
  } else {
    // use traditional uname/pwd
    cloudant = Cloudant({
      account: credentials.username,
      password: credentials.password,
      plugin: 'promises'  // Using the promises plugin to allow use of async/await
    })
  }

  return cloudant
}
