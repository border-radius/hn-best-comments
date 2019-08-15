const getComments = require('./functions/get-comments')
const sendToChannel = require('./functions/send-to-channel')
const { filterCached, cacheItems } = require('./functions/cache')

const UPDATE_INTERVAL = 1000 * 60 * 5

async function job() {
    const comments = await getComments()
    const freshComments = await filterCached(comments)
    console.log('Fetched', comments.length, 'comments, of which', freshComments.length, 'fresh.', new Date().toUTCString())
    const sended = await sendToChannel(process.env.CHANNEL_ID, process.env.BOT_TOKEN, freshComments.slice(0, 5))
    await cacheItems(sended)
}

setInterval(job, UPDATE_INTERVAL)