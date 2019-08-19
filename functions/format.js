const htmlToText = require('html-to-text')
const cheerio = require('cheerio')

module.exports = format

function format(untochedHTML) {
    // first line in HN comment is not framed as a paragraph,
    // so htmlToText is not placing line wrap at it's end
    const fixFirstParagraph = `<p>${untochedHTML.replace('<p>', '</p><p>')}`
    
    // set all links text equal to the href
    // so html-to-text wont create weird markdown-like links
    // like "text... [link]"
    const query = cheerio.load(fixFirstParagraph)
    query('a').each(function () {
        query(this).text(query(this).attr('href'))
    })

    return htmlToText.fromString(query.html(), {
        wordwrap: null,
        hideLinkHrefIfSameAsText: true,
    }).trim().replace(/</g, '&lt;')
}