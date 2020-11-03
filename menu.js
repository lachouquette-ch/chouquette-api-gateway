import { gql } from 'apollo-server-express'

export const typeDefs = gql`
    type Menu @cacheControl(maxAge: 14400) {
        id: ID!
        name: String!
        slug: String!
        items: [MenuItem!]
    }

    enum MenuItemType {
        page, category
    }

    type MenuItem @cacheControl(maxAge: 14400) {
        id: ID!
        type: MenuItemType!
        slug: String!
        url: String
    }
`;

export const resolvers = {
    Query: {
        getMenus: (_, __, {dataSources}) => dataSources.menuAPI.getMenus(),
    }
}