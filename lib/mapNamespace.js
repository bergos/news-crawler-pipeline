import rdf from 'rdf-ext'
import { Transform } from 'readable-stream'

class MapNamespace extends Transform {
  constructor ({ from, to }) {
    super({ objectMode: true })

    this.from = from.value || from.toString()
    this.to = to.value || to.toString()
  }

  _transform (quad, encoding, callback) {
    callback(
      null,
      rdf.quad(this.map(quad.subject), this.map(quad.predicate), this.map(quad.object), this.map(quad.graph))
    )
  }

  map (term) {
    if (term.termType !== 'NamedNode') {
      return term
    }

    if (!term.value.startsWith(this.from)) {
      return term
    }

    return rdf.namedNode(this.to + term.value.slice(this.from.length))
  }
}

function factory ({ from, to }) {
  return new MapNamespace({ from, to })
}

export default factory
