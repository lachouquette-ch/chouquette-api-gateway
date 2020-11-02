const {gql} = require('apollo-server-express');

exports.typeDefs = gql`
    type Query {
        getRedirects: [Redirect!] @cacheControl(maxAge: 14400)
    }
    
    type Redirect {
        from: String!
        to: String!
        status: Int!
    }
`;

exports.resolvers = {
    getRedirects: (_, __, {dataSources}) => dataSources.yoastAPI.getRedirects()
}