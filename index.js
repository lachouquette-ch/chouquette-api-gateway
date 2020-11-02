require('dotenv').config()
const express = require('express')
const {ApolloServer} = require('apollo-server-express')

// Default
const {gql} = require('apollo-server-express');
const Query = gql`
    # TO RESOLVE CACHE CONTROL
    directive @cacheControl(
        maxAge: Int,
        scope: CacheControlScope
    ) on OBJECT | FIELD_DEFINITION

    enum CacheControlScope {
        PUBLIC
        PRIVATE
    }
`
const { typeDef: Wordpress, resolvers: wordpressResolvers } = require('./wordpress')
const { typeDef: Menu, resolvers: menuResolvers } = require('./menu')
const { typeDef: Yoast, resolvers: yoastResolvers } = require('./yoast')

const WordpressAPI = require('./datasources/wordpress')
const MenuAPI = require('./datasources/menu')
const YoastAPI = require('./datasources/yoast')

const responseCachePlugin = require('apollo-server-plugin-response-cache')

const {merge} = require('lodash')
const server = new ApolloServer({
    typeDefs: [Query, Wordpress, Menu, Yoast],
    resolvers: merge(wordpressResolvers, menuResolvers, yoastResolvers),
    dataSources: () => ({
        wordpressAPI: new WordpressAPI(),
        menuAPI: new MenuAPI(),
        yoastAPI: new YoastAPI()
    }),
    plugins: [responseCachePlugin()],
    tracing: true,
    cacheControl: true
});

const app = express();
server.applyMiddleware({app});

app.listen({port: 4000}, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
);