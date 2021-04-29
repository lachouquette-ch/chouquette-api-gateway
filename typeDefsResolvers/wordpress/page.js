import { gql } from "apollo-server-express";
import WordpressBaseAPI from "./baseEndpoint";

export const typeDefs = gql`
  type Page {
    id: ID!
    slug: String!
    title: String
    date: String!
    modified: String
    content: String
    # embedded
    seo: Seo
  }
`;

export const resolvers = {
  Query: {
    pageBySlug: (_, { slug }, { dataSources }) =>
      dataSources.wordpressPageAPI.getBySlug(slug),
  },

  Page: {
    seo(parent) {
      return parent;
    },
  },
};
