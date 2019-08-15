const axios = require('axios')

const ITEM_TIMEOUT = 200

module.exports = sendToChannel

function timeout(time) {
    return new Promise((resolve) => setTimeout(resolve, time))
}

async function sendItem(channel, token, item, index) {
    await timeout(ITEM_TIMEOUT * index)

    try {
        const text = encodeURIComponent(`
Re: <a href="${item.story_link}">${item.story_title}</a>
        
${item.text}
        
${item.author}, <a href="${item.link}">${item.age}</a> ${item.part ? `[${item.part[0]}/${item.part[1]}]` : ''}
        `.trim())

        await axios(`https://api.telegram.org/bot${token}/sendMessage?chat_id=${channel}&parse_mode=html&text=${text}`)
        return item
    } catch(e) {
        console.error(e.message)
        return null
    }
}

async function sendToChannel(channel, token, items) {
    const sending = items.map((item, index) => sendItem(channel, token, item, index))
    const sended = await Promise.all(sending)

    return sended.filter(item => item)
}