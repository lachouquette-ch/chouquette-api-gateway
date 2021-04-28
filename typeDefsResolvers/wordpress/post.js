import { gql } from "apollo-server-express";
import WordpressBaseAPI from "./baseEndpoint";

export const typeDefs = gql`
  type PostCard {
    id: ID!
    slug: String!
    title: String
    image: Media
    categoryId: Int
  }
`;

export const resolvers = {
  Query: {
    latestPostsWithSticky: (_, { number }, { dataSources }) =>
      dataSources.wordpressBaseAPI.getLatestPostsWithSticky(number),
  },

  PostCard: {
    image(parent, _, { dataSources }) {
      return WordpressBaseAPI.mediaReducer(parent.featuredMedia);
    },
  },
};
