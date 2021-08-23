import readable from 'duplex-to/readable.js'
import feedparser from 'feedparser'
import fetch from 'node-fetch'
import rdf from 'rdf-ext'
import { Transform } from 'readable-stream'
import * as ns from './namespaces.js'

class ToRss extends Transform {
  constructor ({ channel, idExtract }) {
    super({ objectMode: true })

    this.channel = rdf.namedNode(channel.value || channel.toString())
    this.idExtract = idExtract && new RegExp(idExtract)
  }

  _transform (raw, encoding, callback) {
    const id = this.idExtract && (raw.link.match(this.idExtract) || [])[1]
    const term = rdf.namedNode((new URL(encodeURIComponent(id || raw.link), this.channel.value)).toString())
    const dataset = rdf.dataset()
    const item = rdf.clownface({ dataset, term })

    item
      .addIn(ns.rss.items, this.channel)
      .addOut(ns.rdf.type, ns.rss.Item)
      .addOut(ns.rss.link, rdf.namedNode(raw.link))
      .addOut(ns.rss.title, raw.title)
      .addOut(ns.rss.description, raw.description)
      .addOut(ns.rss.pubDate, rdf.literal(raw.pubDate.toISOString(), ns.xsd.date))
      .addOut(ns.rss.content, raw.summary)

    for (const category of raw.categories) {
      item.addOut(ns.rss.category, category)
    }

    for (const enclosure of raw.enclosures) {
      if (enclosure.type.startsWith('image')) {
        item.addOut(ns.rss.enclosure, enclosure.url)
      }
    }

    for (const quad of dataset) {
      this.push(quad)
    }

    callback()
  }
}

async function factory ({ channel, idExtract }) {
  const res = await fetch(channel)

  if (!res.ok) {
    throw new Error(await res.text())
  }

  const parser = feedparser()
  const toRss = new ToRss({ channel, idExtract })

  res.body.pipe(parser).pipe(toRss)

  return readable(toRss)
}

export default factory
