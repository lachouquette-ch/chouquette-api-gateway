const {gql} = require('apollo-server-express');

exports.typeDefs = gql`
    type Query {
        getMenus: [Menu!] @cacheControl(maxAge: 14400)
    }

    type Menu {
        id: ID!
        name: String!
        slug: String!
        items: [MenuItem!] @cacheControl(maxAge: 14400)
    }

    enum MenuItemType {
        page, category
    }

    type MenuItem {
        id: ID!
        type: MenuItemType!
        slug: String!
        url: String
    }
`;

exports.resolvers = {
    Query: {
        getMenus: (_, __, {dataSources}) => dataSources.menuAPI.getMenus(),
    }
}