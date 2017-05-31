export default class MainMessage {
  static toSlack(payload) {
    return {
      attachments: [
        {
          title: 'News Tracking',
          title_link: 'https://defb56b2.ngrok.io',
          footer: 'TODO insert CC',
          footer_icon: '',
          color: '9855d4',
          fallback: 'News Tracking',
          fields: [
            {
              title: 'Details',
              value: 'Placeholder TODO',
              short: true
            }
          ],
          image_url: 'https://defb56b2.ngrok.io/example-render.gif',
          attachment_type: 'default',
          callback_id: 'select_filter',
          actions: [
            {
              name: 'filter_list',
              text: 'Query news',
              type: 'select',
              data_source: 'external',
              min_query_length: 1
            },
            {
              name: 'frequency',
              text: 'Alert frequency',
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
  }
}

export class Options {
  static toSlack(payload) {
    let current_value = payload.value
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
              text: 'Recent mergers',
              value: 'recent_mergers'
            },
            {
              text: 'Brand sentiment',
              value: 'brand_sentiment'
            }
          ]
        }
      ]
    }
  }
}
