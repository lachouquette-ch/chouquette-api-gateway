import { gql } from "apollo-server-express";

export const typeDefs = gql`
  type Menu {
    id: ID!
    name: String!
    slug: String!
    items: [MenuItem!]
  }

  enum MenuItemType {
    page
    category
  }

  type MenuItem {
    id: ID!
    type: MenuItemType!
    slug: String!
    url: String
  }
`;

export const resolvers = {};
