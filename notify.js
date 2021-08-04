const fs = require('fs').promises;
const got = require('got');

const SLACK_WEBHOOK = process.argv[2]

const arrayChunk = ([...array], size = 1) => {
    return array.reduce((acc, value, index) => index % size ? acc : [...acc, array.slice(index, index + size)], []);
}

const slackify = (results) => {
    return results.map(item => {
        return [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": item.title,
                    "emoji": true
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "plain_text",
                    "text": `
住所: ${item.address} ${item.spec}
${item.access}
                    `,
                    "emoji": true
                }
            },
            ...item.properties.map(property => {
                return [{
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `
${property.floors} ${property.madori} ${property.menseki}
${property.rent} 管理費: ${property.administration}
敷金: ${property.sikikin} 礼金: ${property.reikin}
`,
                    },
                    "accessory": {
                        "type": "image",
                        "image_url": property.img,
                        "alt_text": item.title,
                    },
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "詳細はこちら"
                    },
                    "accessory": {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "詳細",
                            "emoji": true
                        },
                        "value": "click_me_123",
                        "url": property.link,
                        "action_id": "button-action"
                    }
                }]
            }).flat(),
        ]
    }).flat()
}

(async () => {
    const json = await fs.readFile('results.json');
    const chunks = arrayChunk(JSON.parse(json), 5);
    let initial = true

    await Promise.all(chunks.map(async chunk => {
        const { data } = await got.post(SLACK_WEBHOOK, {
            json: {
                text: initial ? '@me' : '',
                blocks: slackify(chunk)
            }
        });
        initial = false
    }))
})()