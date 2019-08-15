const split = require('./functions/split')
const getComments = require('./functions/get-comments')
const sendToChannel = require('./functions/send-to-channel')
const { filterCached, cacheItems } = require('./functions/cache')

const UPDATE_INTERVAL = 1000 * 60 * 5

async function job() {
    const comments = await getComments()
    const splitedComments = split(comments)
    const freshComments = await filterCached(splitedComments)
    const freshLimitedComments = freshComments.slice(0, 5)
    
    console.log(`Post ${freshLimitedComments.length}/${splitedComments.length}.`, new Date().toUTCString())

    const sended = await sendToChannel(process.env.CHANNEL_ID, process.env.BOT_TOKEN, freshLimitedComments)
    await cacheItems(sended)
}

setInterval(job, UPDATE_INTERVAL)