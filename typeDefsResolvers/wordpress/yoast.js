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
