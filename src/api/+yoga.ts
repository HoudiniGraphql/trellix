import { createYoga } from 'graphql-yoga'
import { DatabaseSync } from 'node:sqlite'
import schema from './+schema'


export default createYoga({
  schema,
  graphqlEndpoint: "_api",
  context: () => {
    return {
      db:  new DatabaseSync('./database.sqlite')
    }
  }
})
