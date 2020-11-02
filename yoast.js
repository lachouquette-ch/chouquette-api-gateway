import { gql } from 'apollo-server-express'

export const typeDefs = gql`
    type Redirect {
        from: String!
        to: String!
        status: Int!
    }
`;

export const resolvers = {
    Query: {
        getRedirects: (_, __, {dataSources}) => dataSources.yoastAPI.getRedirects()
    }
}