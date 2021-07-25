const Keyv = require('keyv')
const Promise = require('bluebird')
const KeyvFile = require('keyv-file')

const CACHE_TTL_MS = 1000 * 3600 * 24 * 30

const keyv = new Keyv({
    store: new KeyvFile({
        filename: `${__dirname}/hn-best-comments.json`,
        expiredCheckDelay: CACHE_TTL_MS
    })
})

exports.filterCached = filterCached
exports.cacheItems = cacheItems

async function filterCached(items) {
    const fresh = await Promise.map(items, async function (item) {
        const cacheId = item.part ? `${item.id}_${item.part[0]}` : item.id
        const exist = await keyv.get(cacheId)
        return exist ? null : item
    })

    return fresh.filter(item => item)
}

async function cacheItems(items) {
    return await Promise.map(items, async function (item) {
        const cacheId = item.part ? `${item.id}_${item.part[0]}` : item.id
        await keyv.set(cacheId, true)
    })
}
