import rdf from 'rdf-ext'

const rdfns = rdf.namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
const rss = rdf.namespace('http://purl.org/rss/1.0/')
const schema = rdf.namespace('http://schema.org/')
const xsd = rdf.namespace('http://www.w3.org/2001/XMLSchema#')

export {
  rdfns as rdf,
  rss,
  schema,
  xsd
}
