import { gql } from "apollo-server-express";

export const typeDefs = gql`
  type Redirect @cacheControl(maxAge: 14400) {
    from: String!
    to: String!
    status: Int!
  }

  type Seo {
    title: String
    metadata: String
    jsonLD: String
  }
`;

export const resolvers = {
  Query: {
    getRedirects: (_, __, { dataSources }) =>
      dataSources.yoastAPI.getRedirects(),
  },

  Seo: {
    title(parent) {
      return parent.yoast_title;
    },
    metadata(parent) {
      return JSON.stringify(parent.yoast_meta);
    },
    jsonLD(parent) {
      return JSON.stringify(parent.yoast_json_ld);
    },
  },
};
