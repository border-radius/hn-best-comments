const split = require('./functions/split')
const getComments = require('./functions/get-comments')
const fetchArticleURLs = require('./functions/fetch-article-urls')
const sendToChannel = require('./functions/send-to-channel')
const { filterCached, cacheItems } = require('./functions/cache')

const UPDATE_INTERVAL = 1000 * 60 * 5

if (typeof process.env.CHANNEL_ID === 'undefined' || typeof process.env.BOT_TOKEN === 'undefined') {
    console.error('Could not start: missing env variables CHANNEL_ID or BOT_TOKEN')
    process.exit(1)
}

async function job() {
    const comments = await getComments()
    const splitedComments = split(comments)
    const freshComments = await filterCached(splitedComments)
    const freshLimitedComments = freshComments.slice(0, 5)
    const freshLimitedCommentsWithURL = await fetchArticleURLs(freshLimitedComments)

    console.log(`Post ${freshLimitedComments.length}/${freshComments.length} (${splitedComments.length}).`, new Date().toUTCString())

    const sended = await sendToChannel(process.env.CHANNEL_ID, process.env.BOT_TOKEN, freshLimitedCommentsWithURL)
    await cacheItems(sended)
}

setInterval(job, UPDATE_INTERVAL)