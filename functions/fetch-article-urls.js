const axios = require('axios')
const cheerio = require('cheerio')
const Promise = require('bluebird')

module.exports = fetchArticleURLs

function timeout(time) {
    return new Promise((resolve) => setTimeout(resolve, time))
}

async function fetchArticleURLs(items) {
    const fetchUrl = await Promise.map(items, async function (item, index) {
        // avoiding http 503 response
        await timeout(2000 * index)

        const {data} = await axios(item.story_link)
        const query = cheerio.load(data)
        const externalLink = query('.athing .storylink').attr('href')
        // skip articles without external URLs
        if (item.story_link.includes(externalLink)) {
            return item
        }
        item.external_link = externalLink

        // extracting domain from URL
        const urlParts = externalLink.split('/')
        const hostname = externalLink.indexOf("//") > -1 ? urlParts[2] : urlParts[0]
        item.external_domain = hostname.replace(/^www\./, '')
        return item;
    })

    return fetchUrl.filter(item => item)
}