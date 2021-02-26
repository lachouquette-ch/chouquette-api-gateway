import { gql } from "apollo-server-express";

export const typeDefs = gql`
  type Menu @cacheControl(maxAge: 14400) {
    id: ID!
    name: String!
    slug: String!
    items: [MenuItem!]
  }

  enum MenuItemType {
    page
    category
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
    menus: (_, __, { dataSources }) => dataSources.menuAPI.getMenu(),
    menu: (_, { slug }, { dataSources }) =>
      dataSources.menuAPI.getMenuById(slug),
  },
};
