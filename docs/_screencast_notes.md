# Screencast Notes

The goal of this screencast is to highlight getting started queries in the Discovery Query Tool and how they're implemented using one of the IBM developed SDKs.

## Opening the Discovery Query Tool

Open Bluemix to the services list: [http://console.bluemix.net/services/](http://console.bluemix.net/services/)

1. Select your Discovery service
1. Click launch tool
1. Select "Watson Discovery News"
1. Select "Query this collection"
1. Select "Build your own query"

## Basic queries

Start by selecting the "Use natural language" for a query.

1. Enter the query "IBM Watson in healthcare"
1. Review the results, notice any which might not fit.
1. Add a filter to remove a result, in the example it's "enrichedTitle.text:!(XFINITY|Xfinity|Comcast)"
1. Review features of filter
  * Highlighting certain attributes in the response
  * Negating a query
  * Grouping

Further inspect the results and the layout of the JSON which is returned from the discovery service.

Compare fields with the [service features](https://www.ibm.com/watson/developercloud/doc/natural-language-understanding/#service-features) in the documentation.

## Advanced queries

Start by selecting "Use the Discovery Query Language" which opens up a text box with the placeholder "Enter query here".

1. Enter the query "IBM Watson in healthcare"
1. Review results and the similarity to the "Use natural language" results
1. Change the query to look for "enrichedTitle.text:21st Century Medicine"
1. Review the results and look for any odd titles
1. Change the query to look for "enrichedTitle.text:\"21st Century Medicine\""
1. Review the results, they shouldn't change much
1. Change the query to look for "enrichedTitle.text:\"21st Century Medicine\: Where Big Tech Is Placing Bets In Healthcare\"", this is an exact search for an article in the results
1. Review that some results are still not relevant
1. Enter this filter "enrichedTitle.text:!\"FE Investegate\""
1. Review that now the "FE Investegate" article is no longer shown

## Moving to the SDK

1. Open the example application on github
1. View the [getStockAlerts function](https://github.com/IBM/watson-discovery-news-alerting/blob/2b5f7ed089916a29570fcf605e944df4f097d3da/web/src/watson/discovery.js#L179)
1. Notice that the fields map directly to the query builder tool

## Further notes

1. "enrichedTitle.text" is used in this screencast but it's a single attribute, any response attribute may be used
1. Multiple attributes may be queried at the same time
