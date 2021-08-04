const { chromium } = require('playwright');
const fs = require('fs').promises;

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    // 新丸子駅、武蔵小杉駅、元住吉駅、日吉駅の賃貸・部屋探し情報　検索結果
    await page.goto('https://suumo.jp/jj/chintai/ichiran/FR301FC001/?ar=030&bs=040&ra=014&rn=0220&ek=022020280&ek=022038720&ek=022039270&ek=022033150&cb=0.0&ct=15.0&mb=40&mt=9999999&et=10&cn=15&shkr1=03&shkr2=03&shkr3=03&shkr4=03&sngz=&po1=09&pc=20');
    const properties = await page.$$('.cassetteitem')
    const results = await Promise.all(properties.map(async (property) => {
        const title = await property.$eval('.cassetteitem_content-title', node => node.innerText)
        const address = await property.$eval('.cassetteitem_detail-col1', node => node.innerText)
        const access = await property.$$eval('.cassetteitem_detail-text', nodes => nodes.map(n => n.innerText).join(','))
        const spec = await property.$$eval('.cassetteitem_detail-col3 > div', nodes => nodes.map(n => n.innerText).join(','))

        const items = await property.$$('.js-cassette_link')

        const properties = await Promise.all(items.map(async (item) => {
            const img = await item.$eval('.js-view_gallery-modal', img => img.getAttribute('rel'))
            const floors = await item.$eval(':nth-match(td, 3)', node => node.innerText)
            const rent = await item.$eval('.cassetteitem_other-emphasis', node => node.innerText)
            const administration = await item.$eval('.cassetteitem_price--administration', node => node.innerText)
            const sikikin = await item.$eval('.cassetteitem_price--deposit', node => node.innerText)
            const reikin = await item.$eval('.cassetteitem_price--gratuity', node => node.innerText)
            const madori = await item.$eval('.cassetteitem_madori', node => node.innerText)
            const menseki = await item.$eval('.cassetteitem_menseki', node => node.innerText)
            const link = 'https://suumo.jp' + await item.$eval('.js-cassette_link_href', node => node.getAttribute('href'))
            
            return {
                img,
                floors,
                rent,
                administration,
                sikikin,
                reikin,
                madori,
                menseki,
                link,
            }
        }))
        return {
            title,
            address,
            access,
            spec,
            properties: properties.flat(1)
        }
    }))
    
    await fs.writeFile('results.json', JSON.stringify(results));
    await browser.close();
})();
