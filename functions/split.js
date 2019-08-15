const TEXT_LENGTH_LIMIT = 3000
const LINE_SPLITTER = new RegExp(`.{1,${TEXT_LENGTH_LIMIT}}`, 'g')

module.exports = split

function split (messages) {
    const splited = messages.map(message => {
        if (message.text.length <= TEXT_LENGTH_LIMIT) {
            return message
        }
        
        const subtexts = []
        const lines = message.text.split('\n')
        
        while (lines.length) {
            const line = lines.shift()

            if (line.length > TEXT_LENGTH_LIMIT) {
                line.match(LINE_SPLITTER).forEach(subline => subtexts.push(subline))
            } else {
                const lastSubtext = subtexts.length && subtexts[subtexts.length - 1]
                const lastAndCurrent = `${lastSubtext}\n${line}`

                if (lastSubtext && lastAndCurrent.length <= TEXT_LENGTH_LIMIT) {
                    subtexts[subtexts.length - 1] = lastAndCurrent
                } else {
                    subtexts.push(line)
                }
            }
        }

        return subtexts.map((subtext, index, { length }) => {
            return Object.assign({}, message, {
                text: subtext.trim(),
                part: [index + 1, length],
            })
        })
    })

    // _.flatten
    return splited.reduce((arr, item) => arr.concat(item), [])
}