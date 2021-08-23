#!/usr/bin/env node

import { Fuseki } from 'store-api'

async function main () {
  const server = new Fuseki()

  await server.createDb('news')
}

main()
