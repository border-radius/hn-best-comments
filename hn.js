const getBestCommentIds = () => {
  const req = $http.send({
    url: 'https://news.ycombinator.com/bestcomments',
    method: 'GET',
  })

  const body = toString(req.body)
  const matches = body.match(/<a href=\"item\?id=(\d+)\">[^<]+<\/a><\/span>/g) || []

  return matches.map(i => i.split('"')[1].split('=')[1])
}

const filterCommentList = list => {
  return list.filter(id => {
    try {
      $app.findFirstRecordByData('hnbc', 'extId', id)
      return false
    } catch (e) {
      return true
    }
  })
}

const enrichCommentList = list => {
  return list.map(id => {
    try {
      const comment = $http.send({
        url: `https://hn.algolia.com/api/v1/items/${id}`,
        method: 'GET',
      })

      const story = $http.send({
        url: `https://hn.algolia.com/api/v1/items/${comment.json.story_id}`,
        method: 'GET',
      })

      return {
        id,
        storyId: comment.json.story_id,
        storyUrl: story.json.url || '',
        storyTitle: story.json.title,
        text: comment.json.text,
        author: comment.json.author,
        createdAt: new Date(comment.json.created_at_i * 1000)
      }
    } catch (e) {}
  }).filter(Boolean)
}

const saveCommentList = list => {
  const hnbc = $app.findCollectionByNameOrId('hnbc')

  list.forEach(item => {
    try {
      const record = new Record(hnbc)

      record.set('extId', item.id)
      record.set('storyId', item.storyId)
      record.set('storyUrl', item.storyUrl)
      record.set('storyTitle', item.storyTitle)
      record.set('text', item.text)
      record.set('author', item.author)
      record.set('extCreated', item.createdAt)

      $app.save(record)
    } catch (e) {}
  })
}

const getUnpublishedComments = () => {
  const records = $app.findRecordsByFilter('hnbc', 'published = false', 'created', 5, 0, {})
  return records.map(record => record.publicExport())
}

const splitComments = list => {
  return list.map(item => {
    if (item.text.length <= 3000) {
      return item
    }

    const lines = item.text.trim().split('<p>').map((line, index) => {
      return index > 0 ? `<p>${line}` : line
    }).filter(Boolean)

    const blocks = lines.reduce((blocks, line) => {
      if (blocks[blocks.length - 1].length + line.length <= 3000) {
        blocks[blocks.length - 1] += line
      } else {
        blocks.push(line)
      }

      return blocks
    }, [''])

    return blocks.map((text, index) => ({
      ...item,
      text,
      part: index + 1,
      partOf: blocks.length,
    }))
  }).reduce((m, c) => m.concat(c), [])
}

const getRelativeDate = date => {
  const diff = Math.round((new Date().getTime() - new Date(date).getTime()) / 1000)

  if (diff >= 86400) {
    const days = Math.round(diff / 86400)

    return days === 1 ? '1 day ago' : `${days} days ago`
  }

  if (diff >= 3600) {
    const hours = Math.round(diff / 3600)

    return hours === 1 ? '1 hour ago' : `${hours} hours ago`
  }

  if (diff >= 60) {
    const minutes = Math.round(diff / 60)

    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
  }

  return diff === 1 ? '1 second ago' : `${diff} seconds ago`
}

const publishComments = list => {
  const botToken = $app.findFirstRecordByData('hnbc_meta', 'key', 'botToken').get('value')
  const channelId = $app.findFirstRecordByData('hnbc_meta', 'key', 'channelId').get('value')

  list.forEach(item => {
    const storyLink = `https://news.ycombinator.com/item?id=${item.storyId}`
    const commentLink = `https://news.ycombinator.com/item?id=${item.extId}`
    const title = item.storyTitle.replace(/</g, '&lt;').replace(/>/g, '&gt;')

    const unixTimestamp = Math.round(item.extCreated.getTime() / 1000)
    const content = [
      `<p>Re: <a href="${storyLink}">${title}</a></p>`,
      '<p></p>',
      item.text,
      '<p></p>',
      `<p><a href="${commentLink}">${item.author}</a>, `,
      `<tg-time unix="${unixTimestamp}" format="r">${getRelativeDate(item.extCreated)}</tg-time>`,
      item.partOf ? ` [${item.part}/${item.partOf}]` : '',
      '</p>'
    ].join('').replace(/<p>/g, '\n\n').replace(/<\/p>/g, '\n\n').replace(/(\n\n+)/g, '\n\n')

    try {
      const res = $http.send({
        url: `https://api.telegram.org/bot${botToken}/sendMessage`,
        method: 'POST',
        body: JSON.stringify({
          chat_id: channelId,
          text: content,
          parse_mode: 'html',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 120,
      })

      if (res.statusCode === 200) {
        const record = $app.findFirstRecordByData('hnbc', 'extId', item.extId)

        record.set('published', true)
        $app.save(record)
      } else {
        $app.logger().error(
          'Failed to publish TG post',
          'tg', true,
          'statusCode', res.statusCode,
          'response', toString(res.json),
          'extId', item.extId,
        )
      }
    } catch (e) {}
  })
}

module.exports = {
  update: () => {
    const ids = getBestCommentIds()
    const newIds = filterCommentList(ids)
    const comments = enrichCommentList(newIds)

    saveCommentList(comments)
  },
  publish: () => {
    const comments = getUnpublishedComments()
    const splittedComments = splitComments(comments)

    publishComments(splittedComments)
  },
}
