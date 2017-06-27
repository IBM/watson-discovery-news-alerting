# Upgrading AlchemyData News API to Watson's Discovery Service News Collection

AlchemyData News API is a solid and well respected product used to filter the news. I've found it solid but lacked features which I need in order to accomplish certain business requirements, like searching based on a complex query. Recently, Watson's Discovery Service released a News Collection which has the features I enjoyed of the AlchemyData News API with new features and easier implementation.

## Example application

Daily, the amount of news being reported is overwhelming without context. There are articles filled with spam or not related to the industries which drive my business. The example application keeps me current with my industry without overwhelming with irrelevant news by utilizing Watson to contextualize news articles. The extra context allows searching based on an amazing number of different attributes which weren't initially included in the articles.

Certain attributes I've found indispensable, like the `taxonomy`, `blekko`, `disambiguated` and the `alchemyapi_text`. Further information on these can be found on [Watson's Natural Language Understanding](https://www.ibm.com/watson/developercloud/doc/natural-language-understanding/) documentation.

The example application is built to monitor the news and highlight important events that it will push updates to me about using either my Slack account, Email address, or both. It uses advanced features which are now available to use from Watson's Discovery Service.

## Reasons to upgrade

* Watson's advanced query language

  [Query building](https://www.ibm.com/watson/developercloud/doc/discovery/query-reference.html#operators) with the Discovery Service allows deeper customization in the results being searched for.

* Visualization support using aggregations

  [Aggregations](https://www.ibm.com/watson/developercloud/doc/discovery/query-reference.html#aggregations) in a query return different numerical counts which can be used in visualizing the results from a query. An example of how this is used is in the [SimpleLineChart](https://github.com/IBM/watson-discovery-news-alerting/blob/2b5f7ed089916a29570fcf605e944df4f097d3da/web/src/components/track.js#L36) and [parseBody](https://github.com/IBM/watson-discovery-news-alerting/blob/2b5f7ed089916a29570fcf605e944df4f097d3da/web/src/components/track.js#L134) function which draw a line chart based on the aggregation data. Any field can be aggregated to have deeper views of the results, like the amount of positive news columns per day or amount of times your company is mentioned per day.

* Working with the news collection is all relevant to custom collections

  After working with the news collection, the code may be used with your own custom collection. For instance, instead of a collection of news you might upload the content of your companies blog and social media posts to monitor the way your communicating the updates from your own company.

* Online query building tool

  This query building tool is incredibly useful in developing new queries and diagnosing issues with existing ones. This feature has no parallel in AlchemyData.

## Getting started with queries

The first step I recommend is to run a few queries using the "Ask a question in plain language" feature of the discovery tool. For instance, querying for the word "IBM" will return articles related to IBM and includes a feature to see the raw JSON response.

The raw JSON response highlights the different attributes which may be queried on. For example, after seeing an example response then a request can be made to "Use the Discovery Query Language" which includes references to fields in the response `enrichedTitle.text::IBM`. After making a request with the query `enrichedTitle.text::IBM`, inspect the raw JSON response again to see how it changes with the different queries.

After feeling confident with the queries, try filtering the end results. Look for one of the results in the response that you believe doesn't belong there and filter it out. For example, I saw in one of the `enrichedTitle.text`s the value "IBMWorld" and decided to filter it out by adding a filter with the value `enrichedTitle.text::IBMWorld`. After making the request including the filter, the results no longer included one with the `enrichedTitle.text` set to "IBMWorld".

While working with visualizing results, there's another feature called the `aggregation` which can be used to aggregate different information about the results. This information is great while building different visualizations, for example the logic in [the example application](https://github.com/IBM/watson-discovery-news-alerting/blob/2b5f7ed089916a29570fcf605e944df4f097d3da/web/src/components/track.js#L134) includes code which pushes the aggregation data to a framework to display the data in a visualization. Keep in mind, these aggregations may not be in the order expected and it's worth it to sort them before displaying.

## Debugging queries

* Reduce to the simplest query, start adding back features. If there's a filter, try removing it and then add it back to compare.
* Use a set of queries you understand and look at them carefully. For instance, search with the `enrichedTitle.text` first before embarking on searching taxonomies.
* Watch for duplicates and completely unrelated articles, these are likely issues with filtering more than relevance but they highlight where there might be issues in relevance.
* Check for unescaped characters being used in the query. For example, your query includes a comma `enrichedTitle.text:IBM, the world leader` but the articles including the title "IBM, the world leader" are not showing up, try escaping the '\,'. This often comes up with exclamation marks ('!'), if not escaped they'll be treated as a logical NOT operation.
* Try being less explicit by using `:` instead of `::`.

## Improving queries

* Post process filtering for duplicated content.

  [Filtering out duplicate titles](https://github.com/IBM/watson-discovery-news-alerting/blob/2b5f7ed089916a29570fcf605e944df4f097d3da/web/src/watson/discovery.js#L186) was used in the example application because there was a pattern in the results for different stock ticker symbols which highlighted duplicated titles. Filtering these out after the response from the Discovery Service is trivial but requires further logic to request results to match the `count` requested.

* Checking the taxonomies in the results which are returned.

  Inspecting the taxonomies, then filtering based on them improves the results greatly. As a post processing step, you could check that the relevance of a certain taxonomy is high enough to be included.

* Using the `~ + Number` with certain names which are often misspelled.

  This is similar to checking the [Levenshtein edit distance](https://en.wikipedia.org/wiki/Levenshtein_distance) to find similar strings. It's useful when there are often misspellings where a small change in the spelling means the same thing. I've found this most useful with user generated content, like comments on social media posts.

* Boosting `^multiplier` important terms.

  Boosting allows one term to affect the results more than the other terms. This is especially useful when querying based on multiple attributes where one is the primary attribute related to relevance.

* Sorting results with the `sort` field.

  For instance, with the news articles it might be more important that they're recent than that they're relevant so it's possible to sort based on the date the news was posted.

* Only allow news with `blekko.documentType::news`.

## General performance considerations

The news collection doesn't update in real-time and has the ability of being cached each day. Caching the request will allow quicker results to the end user and less charges on the monthly bill.

An example cache key would be a one-way hash of the `query`, `filter`, `aggregation`, and `return`. This key would keep track of all the results from the request and subsequent duplicated requests won't be required to hit Watson again.

## Security

AlchemyData News API required keeping track of a single API access key which could be used externally to query the data set. That worked well but the upgraded Watson Discovery Service News Collection uses the same authentication setup as other services in Bluemix. The benefit here is that it's easy to configure and they provide multiple modules built to get the access credentials required.

## Bluemix

Hosting both the application accessing Watson Discovery Service News Collection and the application querying it with Bluemix allowed seamless integration. All the environment is automatically setup properly to allow access between the features rapidly. Using the `manifest.yml`, the relationship between the multiple services is setup for further uses.
