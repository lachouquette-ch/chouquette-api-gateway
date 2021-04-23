import { gql } from "apollo-server-express";

export const typeDefs = gql`
  type Redirect {
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
  Seo: {
    title(parent) {
      return parent.seoTitle;
    },
    metadata(parent) {
      return JSON.stringify(parent.seoMeta);
    },
    jsonLD(parent) {
      return JSON.stringify(parent.seoJsonLd);
    },
  },
};
