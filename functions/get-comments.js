const axios = require('axios')
const cheerio = require('cheerio')
const htmlToText = require('html-to-text')

const URL_PREFIX = 'https://news.ycombinator.com'
const COMMENTS_URL = 'https://news.ycombinator.com/bestcomments'

module.exports = getComments

async function getComments() {
    const { data } = await axios(COMMENTS_URL)
    const query = cheerio.load(data)
    
    return query('.athing').map(function () {
        return {
            id: query(this).attr('id'),
            age: query(this).find('.age a').text().trim(),
            link: `${URL_PREFIX}/${query(this).find('.age a').attr('href')}`,
            // cheerio's .text() is tend to lose line breaks in the process
            // see: https://github.com/cheeriojs/cheerio/issues/839
            // also first line in HN comment is not framed as a paragraph,
            // so htmlToText is not placing line wrap at it's end
            text: htmlToText.fromString(`<p>${query(this).find('.comment').html().replace('<p>', '</p><p>')}`, {
                wordwrap: null,
                hideLinkHrefIfSameAsText: true,
            }).trim(),
            author: query(this).find('.hnuser').text().trim(),
            story_link: `${URL_PREFIX}/${query(this).find('.storyon a').attr('href')}`,
            story_title: query(this).find('.storyon a').text().trim(),
        }
    }).get()
}