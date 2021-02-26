import { gql } from "apollo-server-express";

export const typeDefs = gql`
  type PostCard {
    id: ID!
    slug: String!
    title: String
    cover: Media
    categories: [Category!]
  }
`;

export const resolvers = {
  Query: {
    latestPostsWithSticky: (_, { number }, { dataSources }) =>
      dataSources.wordpressBaseAPI.getLatestPostsWithSticky(number),
  },

  PostCard: {
    cover(parent, _, { dataSources }) {
      return dataSources.wordpressBaseAPI.getMediaById(parent.featured_media);
    },
    categories(parent, _, { dataSources }) {
      return dataSources.wordpressBaseAPI.getCategoryByIds(
        parent.top_categories
      );
    },
  },
};
