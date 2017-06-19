# Watson Discovery News Alerting [![Build Status](https://travis-ci.org/eerwitt/discovery-news.svg?branch=master)](https://travis-ci.org/eerwitt/discovery-news)

[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://github.com/eerwitt/discovery-news)

In this developer journey we built an application which integrates with Watson Discovery Service's example news collection to push updates via email or Slack for different tasks common to many brand managers.

The journey highlights the steps required to build a front-end management interface to search Watson and a back-end service which periodically sends updates out related to customizable queries.

# General Project Layout

The server which hosts the React web application, acts as an API to Watson, and communicates with the Slack App can be found at:

```
./web/server.js
```

The server which periodically emails news alerts to subscribed users can be found at:

```
./tracker/worker.js
```

![Architecture Diagram](https://raw.githubusercontent.com/eerwitt/watson-discovery/master/docs/architecture.png)

# Included components

* [Watson Discovery](https://www.ibm.com/watson/developercloud/discovery.html) - Rapidly build a cognitive search and content analytics engine
* [Cloudant Database](https://cloudant.com/) - Cloudant is the distributed database as a service (DBaaS) built from the ground up to deliver fast-growing application data to the edge.

# Featured technologies

* [Node.js](https://nodejs.org/en/) - An asynchronous event driven JavaScript runtime, designed to build scalable applications
* [Slack](https://slack.com) - Slack is a cloud-based set of team collaboration tools and services with chat bot integration
* [React](https://facebook.github.io/react/) - JavaScript library for building User Interfaces
* [express](https://expressjs.com) - Most popular and minimalistic web framework for creating API and Web server
* [yarn](https://yarnpkg.com) - Fast, reliable and secure dependency manager for node.js

# Getting Started

## Prerequisites

Make sure before you start you have the following tasks done:

1. Install [nodejs](https://nodejs.org/en/) and [yarn](https://yarnpkg.com)
2. Install the [Bluemix CLI](https://console.bluemix.net/docs/cli/index.html) tool
3. Have a [Bluemix account](https://console.ng.bluemix.net/registration/)


## Steps

### 1. Clone the repo

[Clone this repository](https://help.github.com/articles/cloning-a-repository/) to a directory on your local system and go into that directory.

### 2. Install the dependencies and bootstrap

Install all of the dependencies by running `yarn` command separately for the web and tracker applications. This will install all of the node modules specified in the package.json

```sh
$ cd web
$ yarn
```

Change back to the directory this project was cloned to, then run:

```sh
$ cd tracker
$ yarn
```

### 3. Create Bluemix Services

Create the following services, note that these links will by default start the service in the Bluemix `us-south` region:

* [Watson Discovery](https://console.ng.bluemix.net/catalog/services/discovery?env_id=ibm:yp:us-south)
* [Cloudant Database](https://console.bluemix.net/catalog/services/cloudant-nosql-db?env_id=ibm:yp:us-south)

### 6. Starting the Services

Start the app by running `yarn start`.

```sh
$ cd web
$ yarn run build
$ yarn start
```

Open the browser and go to `http://localhost:4391`

### 7. Deploy to Bluemix

To deploy to Bluemix make sure you have Bluemix CLI tool installed. Then run the following commands to connect it with Bluemix and login with your Bluemix credentials.

```sh
$ bluemix login
```

Then to deploy just run the following command and it will push the code, deploy it to a server and run it.

```sh
$ bluemix cf push
```

Go to the URL that is printed at the end after deployment is done and you can view the app.

# Architecture

## Back-end Server

Handles hosting of the static assets (React front-end application) and manages a thin API used by both the front-end application and the Slack application.

## Front-end Application

Displays results from querying the Watson Discovery Service API and manages subscriptions for push updates.

## Slack Application

Manages and receives push updates from the worker application.

## Worker Application

Background process which periodically sends updates to Slack and or email.

## Useful Links

### Bot
* https://dashboard.ngrok.com/get-started
* https://api.slack.com/docs/message-menus
* https://api.slack.com/interactive-messages
* http://phantomjs.org/quick-start.html
* https://github.com/eugeneware/gifencoder
* http://amirraminfar.com/phantomjs-node/
* https://www.ibm.com/watson/developercloud/doc/discovery/building.html#understanding-the-difference-between-entities-concepts-and-keywords
* https://github.com/ibm/watson-online-store
* https://github.com/watson-developer-cloud/node-sdk
