import { gql } from "apollo-server-express";

export const typeDefs = gql`
  type PostCard {
    id: ID!
    slug: String!
    title: String
    image: Media
    categories: [Int!]
  }
`;

export const resolvers = {
  Query: {
    latestPostsWithSticky: (_, { number }, { dataSources }) =>
      dataSources.wordpressBaseAPI.getLatestPostsWithSticky(number),
  },

  PostCard: {
    image(parent, _, { dataSources }) {
      return dataSources.wordpressBaseAPI.getMediaById(parent.featured_media);
    },
  },
};
