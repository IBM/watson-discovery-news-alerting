# Project Structure

Important directories and files which are used by this project.

```
.
├── CONTRIBUTING.md # Contains information on how to contribute
├── LICENSE # License under which the software is release
├── README.md # Overview on the project and how to get started
├── MAINTAINERS.md # Project maintainers
├── ACKNOWLEDGEMENTS.md # Community
├── manifest.yml # Configuration used to deploy app to Bluemix
├── Procfile # file used by bluemix to start the web server
├── app # directory for application
│   ├── server.js     # main application
│   ├── notifier.js   # tracker application for sending alerts
│   └── package.json  # Config file containing dependencies and scripts and babel config
├── doc # Documentation for this project and related assets
│   ├── _screencast_notes.md # Blog post to accompany video
│   └── _upgrading_alchemy_news_to_watson_discovery.md # Blog post with details about the upgrade
```
