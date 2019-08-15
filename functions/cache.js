const os = require('os')
const Keyv = require('keyv')
const KeyvFile = require('keyv-file')

const CACHE_TTL_MS = 1000 * 3600 * 24 * 30

const keyv = new Keyv({
    store: new KeyvFile({
        filename: `${os.tmpdir()}/hn-best-comments.json`,
        expiredCheckDelay: CACHE_TTL_MS
    })
})

exports.filterCached = filterCached
exports.cacheItems = cacheItems

async function nullIfExist(item) {
    const cacheId = item.part ? `${item.id}_${item.part[0]}` : item.id
    const exist = await keyv.get(cacheId)
    return exist ? null : item
}

async function save(item) {
    const cacheId = item.part ? `${item.id}_${item.part[0]}` : item.id
    await keyv.set(cacheId, true)
}

async function filterCached(items) {
    const checking = items.map(nullIfExist)
    const fresh = await Promise.all(checking)
    return fresh.filter(item => item)
}

async function cacheItems(items) {
    const caching = items.map(save)
    await Promise.all(caching)
    return items
}