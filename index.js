require('dotenv').config();
const express = require('express');
const {ApolloServer} = require('apollo-server-express');
const typeDefs = require('./schema');
const resolvers = require('./resolvers')

const WordpressAPI = require('./datasources/wordpress')
const MenuAPI = require('./datasources/menu')

const server = new ApolloServer({
    typeDefs,
    resolvers,
    dataSources: () => ({
       wordpressAPI: new WordpressAPI(),
       menuAPI: new MenuAPI()
    })
});

const app = express();
server.applyMiddleware({app});

app.listen({port: 4000}, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
);