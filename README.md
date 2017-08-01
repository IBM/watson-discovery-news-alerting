[![Build Status](https://travis-ci.org/ibm/watson-discovery-news-alerting.svg?branch=master)](https://travis-ci.org/ibm/watson-discovery-news-alerting)

# Watson Discovery News Alerting 

In this developer journey, we will build a Node.js web application that will use the Watson Discovery Service to access Watson Discovery News.

Watson Discovery News is a default data collection that is associated with the Watson Discovery Service. It is a dataset of primarily English language news sources that is updated continuously, with approximately 300,000 new articles and blogs added daily.

The focus of this journey is to monitor a product's marketplace life-cycle using Watson's Discovery service to intelligently alert when a product's stance in the marketplace has changed. Users can recieve periodic email alerts about a product or brand and how they're perceived in the News.

Alert tracking can be set up for the following areas:
* The product
* The brand
* Related products and brands
* Positive or negative product sentiment
* Stock prices

The journey highlights the steps required to build a front-end management interface to search Watson News and a back-end service which periodically sends alerts out related to customizable queries.

![](doc/source/images/architecture.png)

## Flow

1. The user interacts with the backend server via the app UI. The frontend app UI uses React to render search results and can reuse all of the views that are used by the backend for server side rendering. The frontend is using watson-react-components and is responsive.
2. User input is processed and routed to the backend server, which is responsible for server side rendering of the views to be displayed on the browser. The backend server is written using express and uses express-react-views engine to render views written using React.
3. The backend server stores subscription information in a Cloudant NonSQL database for product tracking.
4. The backend server sends user requests to the Watson Discovery Service. It acts as a proxy server, forwarding queries from the frontend to the Watson Discovery Service API while keeping sensitive API keys concealed from the user.
5. The Watson Discovery Service queries the Watson News Collection for articles related to the product.
6. The backend server sends periodic updates to email.

## With Watson

Want to take your Watson app to the next level? Looking to leverage Watson Brand assets? Join the [With Watson](https://www.ibm.com/watson/with-watson) program which provides exclusive brand, marketing, and tech resources to amplify and accelerate your Watson embedded commercial solution.

# Included components

* [Watson Discovery](https://www.ibm.com/watson/developercloud/discovery.html): A cognitive search and content analytics engine for applications to identify patterns, trens, and actionable insights.
* [Cloudant NoSQL DB for Bluemix](https://console.bluemix.net/docs/services/Cloudant/cloudant.html#overview): A fully managed data layer designed for modern web and mobile applications that leverages a flexible JSON schema.

# Featured technologies

* [Node.js](https://nodejs.org/en/) - An asynchronous event driven JavaScript runtime, designed to build scalable applications
* [React](https://facebook.github.io/react/) - Javascript library for building User Interfaces
* [Express](https://expressjs.com) - A popular and minimalistic web framework for creating API and Web server
* [Yarn](https://yarnpkg.com) - Fast, reliable and secure dependency manager for node.js

# Watch the Video

[![](http://img.youtube.com/vi/N-HaIpPGde0/0.jpg)](https://youtu.be/N-HaIpPGde0)

# Steps

You can choose to ``Deploy to Bluemix`` **OR** run locally. In either case, you will need to:

1. [Clone the repo](#1-clone-the-repo)
2. [Create Bluemix services](#2-create-watson-services-with-ibm-bluemix)

## 1. Clone the repo

Clone the `watson-discovery-news-alerting` locally. In a terminal, run:
```
$ git clone https://github.com/ibm/watson-discovery-news-alerting
```

## 2. Create Watson Services with IBM Bluemix

Create the following service:

  * [**Watson Discovery**](https://console.ng.bluemix.net/catalog/services/discovery) - name the service `wdna-discovery`
  * [**Cloudant NoSQL DB**](https://console.bluemix.net/catalog/services/cloudant-nosql-db) - name the service `wdna-cloudant`

## Run the application locally

1. Install [Node.js](https://nodejs.org/en/) and [Yarn](https://yarnpkg.com)
2. Install all of the dependencies by running `yarn`. This will install of the node modules specified in [`package.json`](package.json)
```
$ cd app
$ yarn
```
3. Copy the `env.sample` to `.env`
```
$ cp .env.sample .env
```
4. Edit the `.env` file and enter the Watson Discovery credentials and SMTP Mail settings if you wish to use the tracking feature.
5. Build and start the main app.
```
$ yarn run build
$ yarn start
```
6. Build and start the tracking app.
```
$ yarn run start-notifier
```
6. Open a browser and go to `http://localhost:4391`

## Deploy and run the application on Bluemix

To deploy to Bluemix make sure you have Bluemix CLI tool installed. Then run the following commands to connect it with Bluemix and login with your Bluemix credentials.

```sh
$ cd watson-discovery-news-alerting
$ bluemix login
```

Then to deploy just run the following command and it will push the code, deploy it to a server and run it.

```sh
$ bluemix cf push
```

If the `cf push` command complains that the application name is already taken, change the lines in the `manifest.yml` to have a custom application name specific for your setup:

```yaml
...
applications:
- name: custom-name
  path: ./app
...
```
Two Bluemix applications should be created and running:
* watson-discovery-news-alerting
* watson-discovery-news-alerting-notifier

Set the environment variables required for each the notifier service to perform properly. Use the values unique to your setup:

```sh
$ bluemix cf set-env watson-discovery-news-alert-notifier SMTP_SETTINGS '{"host":"smtp.gmail.com","user":"xxx@gmail.com","pass":"xxx","fromEmail":"xxx@gmail.com"}'
$ bluemix cf set-env watson-discovery-news-alert-notifier BASE_URL 'https://watson-discovery-news-alerting.mybluemix.net'
```

Go to the URL route that is associated with the `watson-discovery-news-alerting` app in Bluemix to view the application. Typically, this would be `https://watson-discovery-news-alerting.mybluemix.net`. 

# Sample output

![](doc/source/images/sample-output.png)

# General Project Layout

The server which hosts the React web application, acts as an API to Watson, and communicates with the notifier App can be found at:

```
./app/server.js
```

The server which periodically emails news alerts to subscribed users can be found at:

```
./app/notifier.js
```

![Architecture Diagram](doc/source/images/detailed-architecture.png)

# Architecture

## Back-end Server

Handles hosting of the static assets (React front-end application) and manages a thin API used by the front-end application.

## Front-end Application

Displays results from querying the Watson Discovery Service API and manages subscriptions for push updates.

## Worker Application

Background process which periodically sends updates to email.

# Troubleshooting

* Setting environment variables for a local run in `.env` config file

> NOTE: This only needs to be set if the application is running locally.

The credentials for Bluemix services (wdna-discovery and wdna-cloudant), can
be found in the ``Services`` menu in Bluemix, and selecting the ``Service Credentials``
option.

* Ensure port is not already in use

If the port is unavailable, you will see the following error:

```
Error: listen EADDRINUSE :::{port}
```

# License

[Apache 2.0](LICENSE)

## Useful Links

### Discovery Service
* https://www.ibm.com/watson/developercloud/doc/discovery/query-reference.html
* https://www.ibm.com/watson/developercloud/doc/natural-language-understanding/#service-features

### Web
* http://recharts.org/

### Bot
* https://dashboard.ngrok.com/get-started
* http://phantomjs.org/quick-start.html
* https://github.com/eugeneware/gifencoder
* http://amirraminfar.com/phantomjs-node/
* https://www.ibm.com/watson/developercloud/doc/discovery/building.html#understanding-the-difference-between-entities-concepts-and-keywords
* https://github.com/ibm/watson-online-store
* https://github.com/watson-developer-cloud/node-sdk

### Testing
* https://facebook.github.io/jest/
