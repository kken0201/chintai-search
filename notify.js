const fs = require('fs').promises;
const got = require('got');

const SLACK_WEBHOOK = process.argv[2]

const arrayChunk = ([...array], size = 1) => {
    return array.reduce((acc, value, index) => index % size ? acc : [...acc, array.slice(index, index + size)], []);
}

const formatDate = (date)=>{
    return date.getFullYear() + "年" + (date.getMonth() + 1) + "月" + date.getDate() + "日";
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
住所: ${item.address}
${item.spec}
${item.access}
                    `,
                    "emoji": true
                }
            },
            ...item.properties.map(property => {
                return [{
                    "type": "image",
                    "image_url": property.img,
                    "alt_text": item.title
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `
*${property.rent}* (${property.administration})
${property.floors} ${property.madori} ${property.menseki}
敷金: ${property.sikikin} 礼金: ${property.reikin}
`,
                    },
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "ㅤ"
                    },
                    "accessory": {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "詳細はこちら",
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
    const json = await fs.readFile('arrival.json');
    const results = JSON.parse(json);

    if (results.length === 0) {
        const { data } = await got.post(SLACK_WEBHOOK, {
            json: {
                text: '今日の新着物件はありません',
            }
        });
        return
    }

    const chunks = arrayChunk(results, 5);

    await Promise.all(chunks.map(async (chunk, index) => {
        const blocks = slackify(chunk)
        if (index === 0) {
            blocks.unshift({
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": `~${formatDate(new Date())}の新着物件情報スタート~`,
                    "emoji": true
                }
            })
        }
        if (index === chunks.length - 1) {
            blocks.push({
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": `~${formatDate(new Date())}の新着物件情報おわり~`,
                    "emoji": true
                }
            })
        }
        const { data } = await got.post(SLACK_WEBHOOK, {
            json: {
                text: index === 0 ? '@me' : '',
                blocks
            }
        });
    }))
})()