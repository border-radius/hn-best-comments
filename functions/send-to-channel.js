const axios = require('axios')
const Promise = require('bluebird')

const ITEM_TIMEOUT = 200

module.exports = sendToChannel

function timeout(time) {
    return new Promise((resolve) => setTimeout(resolve, time))
}

async function sendItem(channel, token, item, index) {
    await timeout(ITEM_TIMEOUT * index)

    try {
        const text = encodeURIComponent(`
Re: <a href="${item.story_link}">${item.story_title}</a> ${item.external_link ? `(<a href="${item.external_link}">${item.external_domain}</a>)` : ''}
        
${item.text}
        
${item.author}, <a href="${item.link}">${item.age}</a> ${item.part ? `[${item.part[0]}/${item.part[1]}]` : ''}
        `.trim())

        await axios(`https://api.telegram.org/bot${token}/sendMessage?chat_id=${channel}&parse_mode=html&disable_web_page_preview=true&text=${text}`)
        return item
    } catch(e) {
        console.error(e.message)
        return null
    }
}

async function sendToChannel(channel, token, items) {
    const sended = await Promise.map(items, async function (item, index) {
        return sendItem(channel, token, item, index)
    })

    return sended.filter(item => item)
}