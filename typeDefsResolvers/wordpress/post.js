import { gql } from "apollo-server-express";
import WordpressBaseAPI from "./baseEndpoint";

export const typeDefs = gql`
  type Post {
    id: ID!
    slug: String!
    title: String
    date: String!
    modified: String!
    content: String
    # ids (should be prefetched)
    categoryId: Int
    # embedded
    image: Media
    seo: Seo
    author: Author
  }

  type PostCard {
    id: ID!
    slug: String!
    title: String
    categoryId: Int
    # embedded
    image: Media
  }
`;

export const resolvers = {
  Query: {
    latestPostsWithSticky: (_, { number }, { dataSources }) =>
      dataSources.wordpressBaseAPI.getLatestPostsWithSticky(number),

    postBySlug: (_, { slug }, { dataSources }) =>
      dataSources.wordpressPostAPI.getBySlug(slug),
  },

  Post: {
    seo(parent) {
      return parent;
    },
  },

  PostCard: {
    image(parent, _, { dataSources }) {
      return WordpressBaseAPI.mediaReducer(parent.featuredMedia);
    },
  },
};
