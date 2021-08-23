import { readFile } from 'fs/promises'
import once from 'lodash/once.js'
import Crawler from 'news-crawler/lib/Crawler.js'
import rdf from 'rdf-ext'
import { Transform } from 'readable-stream'
import * as ns from './namespaces.js'

class NewsCrawler extends Transform {
  constructor ({ config }) {
    super({ objectMode: true })

    this.config = config

    this.crawler = null
    this.init = once(this._init.bind(this))
  }

  async _init () {
    const config = JSON.parse((await readFile(this.config)).toString())
    const extractors = []

    for (const [name, args] of Object.entries(config)) {
      const Instance = (await import(`news-crawler/lib/${name}.js`)).default

      extractors.push(new Instance(args))
    }

    this.crawler = new Crawler({ extractors })

    await this.crawler.start()
  }

  async _flush (callback) {
    try {
      await this.crawler.stop()

      callback()
    } catch (err) {
      callback(err)
    }
  }

  async _transform ({ article, link }, encoding, callback) {
    try {
      await this.init()

      const term = rdf.namedNode(article)
      const dataset = rdf.dataset()
      const ptr = rdf.clownface({ dataset, term })

      const data = await this.crawler.extract(link)

      if (!data) {
        return callback()
      }

      ptr
        .addIn(ns.schema.sameAs, rdf.namedNode(link))
        .addOut(ns.rdf.type, ns.schema.NewsArticle)
        .addOut(ns.schema.about, rdf.namedNode(data.url))
        .addOut(ns.schema.title, data.title)
        .addOut(ns.schema.abstract, data.abstract)
        .addOut(ns.schema.content, data.content)

      for (const image of data.images) {
        if (image.startsWith('http')) {
          ptr.addOut(ns.schema.image, ptr.namedNode(image))
        }
      }

      for (const quad of dataset) {
        this.push(quad)
      }

      callback()
    } catch (err) {
      callback(err)
    }
  }
}

function factory ({ config }) {
  return new NewsCrawler({ config })
}

export default factory
