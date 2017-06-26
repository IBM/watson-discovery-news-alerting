# Upgrading AlchemyData News API to Watson's Discovery Service News Collection

AlchemyData News API is a solid and well respected product used to filter the news. I've found it solid but it lacked features which I need in order to accomplish business requirements. Recently, Watson's Discovery Service released a News Collection which has the features I enjoyed of the AlchemyData News API with new features and easier implementation.

## Example application

Daily, the amount of news being reported is overwhelming without context. There are articles filled with spam or not related to the industries which drive my business. The example application keeps me current with my industry without overwhelming with irrelevant news by utilizing Watson to contextualize news articles. The extra context allows searching based on an amazing number of different attributes which weren't initially included in the articles.

Certain attributes I've found indispensable, like the `taxonomy`, `blekko`, `disambiguated` and the `alchemyapi_text`.

The example application is built to monitor the news and highlight important events that it will push updates to me about using either my Slack account, Email address, or both. It uses advanced features which are now available to use from Watson's Discovery Service.

## Reasons to upgrade

* Advanced queries
* Ability to aggregate results in order to visualize them
* Code can be changed to use your own custom collections
* Online tool to help in building and trying different queries

## Getting started with queries

The first step I recommend is to run a few queries using the "Ask a question in plain language" feature of the discovery tool. For instance, querying for the word "IBM" will return articles related to IBM and includes a feature to see the raw JSON response.

The raw JSON response highlights the different attributes which may be queried on. For example, after seeing an example response then a request can be made to "Use the Discovery Query Language" which includes references to fields in the response `enrichedTitle.title::IBM`. After making a request with the query `enrichedTitle.title::IBM`, inspect the raw JSON response again to see how it changes with the different queries.

After feeling confident with the queries, try filtering the end results. Look for one of the results in the response that you believe doesn't belong there and filter it out. For example, I saw in one of the `enrichedTitle.title`s the value "IBMWorld" and decided to filter it out by adding a filter with the value `enrichedTitle.title::IBMWorld`. After making the request including the filter, the results no longer included one with the `enrichedTitle.title` set to "IBMWorld".

While working with visualizing results, there's another feature called the `aggregation` which can be used to aggregate different information about the results. This information is great while building different visualizations, for example the logic in `../src/components/track.js` includes code which pushes the aggregation data to a framework to display the data in a visualization. Keep in mind, these aggregations may not be in the order expected and it's worth it to sort them before displaying.

## Debugging queries

* Reduce to the simplest query, start adding back features
* Use a set of queries you understand and look at them carefully
* Watch for duplicates and completely unrelated articles
* Remove the filters to begin with
* Check for unescaped characters being used in the query 
* Try being less exact `:!` and check over the results being returned

## Improving queries

* Filtering for duplicates
* Checking the taxonomies in the results which are returned
* Using the `~ + Number` and `()` for grouping
* Boosting `^multiplier`
* `sort`
* Only allow news with `blekko.documentType::news`

## General performance considerations

The news collection doesn't update in real-time and has the ability of being cached each day. Caching the request will allow quicker results to the end user and less charges on the monthly bill.

An example cache key would be a one-way hash of the `query`, `filter`, `aggregation`, and `return`. This key would keep track of all the results from the request and subsequent duplicated requests won't be required to hit Watson again.

## Security

AlchemyData News API required keeping track of a single API access key which could be used externally to query the data set. That worked well but the upgraded Watson Discovery Service News Collection uses the same authentication setup as other services in Bluemix. The benefit here is that it's easy to configure and they provide multiple modules built to get the access credentials required.

## Bluemix

Hosting both the application accessing Watson Discovery Service News Collection and the application querying it with Bluemix allowed seemless integration. All the environment is automatically setup properly to allow access between the features rapidly. Using the `manifest.yml`, the relationship between the multiple services is setup for further uses.
