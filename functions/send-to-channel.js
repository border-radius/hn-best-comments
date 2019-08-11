const axios = require('axios')

module.exports = sendToChannel

async function sendItem(channel, token, item) {
    try {
        const text = encodeURIComponent(`
Re: <a href="${item.story_link}">${item.story_title}</a>
        
${item.text}
        
${item.author}, <a href="${item.link}">${item.age}</a>
        `.trim())

        await axios(`https://api.telegram.org/bot${token}/sendMessage?chat_id=${channel}&parse_mode=html&text=${text}`)
        return item
    } catch(e) {
        console.error(e.message)
        return null
    }
}

async function sendToChannel(channel, token, items) {
    const sending = items.map(item => sendItem(channel, token, item))
    const sended = await Promise.all(sending)

    return sended.filter(item => item)
}