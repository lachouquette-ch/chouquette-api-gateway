import { gql } from "apollo-server-express";

export const typeDefs = gql`
  type Redirect @cacheControl(maxAge: 14400) {
    from: String!
    to: String!
    status: Int!
  }

  type Seo {
    metaTitle: String
    metaDescription: String
    metaRobots: String
    jsonLD: String
    openGraph: String
    twitter: String
  }
`;

export const resolvers = {
  Query: {
    getRedirects: (_, __, { dataSources }) =>
      dataSources.yoastAPI.getRedirects(),
  },

  Seo: {
    metaTitle: (parent, _, __) => {
      return parent.yoast_title;
    },
    metaDescription(parent, _, __) {
      console.log(parent);
      let property = parent.yoast_meta.find(
        ({ name }) => name === "description"
      );
      return property ? property.content : null;
    },
    metaRobots(parent, _, __) {
      let property = parent.yoast_meta.find(
        ({ name }) => name === "description"
      );
      return property ? property.content : null;
    },
    jsonLD(parent, _, __) {
      return JSON.stringify(parent.yoast_json_ld);
    },
    openGraph(parent, _, __) {
      return JSON.stringify(
        parent.yoast_meta.filter(
          ({ property }) => property && property.startsWith("og:")
        )
      );
    },
    twitter(parent) {
      return JSON.stringify(
        parent.yoast_meta.filter(
          ({ name }) => name && name.startsWith("twitter:")
        )
      );
    },
  },
};
