// These are the different messages available to Slack, all details were pulled from Slack's documentation on attachments
export default class MainMessage {
  static toSlack(alertType, keyword) {
    const response = {
      attachments: [
        {
          title: 'Watson Discover News Tracking',
          title_link: process.env.BASE_URL,
          footer: 'IBM',
          footer_icon: '',
          color: '9855d4',
          fallback: 'Watson Discovery News Tracking',
          fields: [
            {
              title: 'Details',
              value: "Monitor a product's marketplace life-cycle using Watson's Discovery service to intelligently alert when a product's stance in the marketplace has changed. Receive periodic updates via email or Slack related to a product or brand and how they're perceived in the News.",
              short: false
            }
          ],
          image_url: `${process.env.BASE_URL}/images/example-render.gif`,
          attachment_type: 'default',
          callback_id: 'select_filter',
          actions: [
            {
              name: 'alert_type',
              text: 'Alert type',
              type: 'select',
              options: [
                {
                  text: 'Brand Alerts',
                  value: 'brand-alerts'
                },
                {
                  text: 'Product Alerts',
                  value: 'product-alerts'
                },
                {
                  text: 'Related Brands',
                  value: 'related-brands'
                },
                {
                  text: 'Positive Product Alerts',
                  value: 'positive-product-alerts'
                }
              ]
            },
            {
              name: 'filter_list',
              text: 'Keyword (brand or product name)',
              type: 'select',
              data_source: 'external',
              min_query_length: 1
            },
            {
              name: 'frequency',
              text: 'Frequency of updates',
              type: 'select',
              options: [
                {
                  text: 'Daily',
                  value: 'daily'
                },
                {
                  text: 'Weekly',
                  value: 'weekly'
                },
                {
                  text: 'Monthly',
                  value: 'monthly'
                }
              ]
            },
            {
              name: 'track',
              text: 'Track',
              style: 'primary',
              type: 'button',
              value: 'track'
            }
          ]
        }
      ]
    }

    if (alertType) {
      response.attachments[0].actions = response.attachments[0].actions.filter((action) => action.name !== 'alert_type')
      response.attachments[0].fields.push({
        title: 'Alert type',
        value: alertType,
        short: true
      })
    }

    if (keyword) {
      response.attachments[0].actions = response.attachments[0].actions.filter((action) => action.name !== 'filter_list')
      response.attachments[0].fields.push({
        title: 'Keyword',
        value: keyword,
        short: true
      })
    }

    return response
  }
}

export class Options {
  static toSlack(payload) {
    const current_value = payload.value
    return {
      option_groups: [
        {
          text: 'Custom query',
          options: [
            {
              text: current_value,
              value: current_value
            }
          ]
        },
        {
          text: 'Examples',
          options: [
            {
              text: 'IBM',
              value: 'IBM'
            },
            {
              text: 'IBM Watson',
              value: 'IBM Watson'
            }
          ]
        }
      ]
    }
  }
}
