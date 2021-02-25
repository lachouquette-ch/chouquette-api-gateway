import { gql } from "apollo-server-express";

export const typeDefs = gql`
  type Settings {
    name: String
    description: String
    url: String
  }

  type Location {
    id: ID!
    parentId: Int
    name: String
    slug: String
    description: String
  }

  type MediaSize {
    width: Int!
    height: Int!
    url: String!
  }

  type MediaDetail {
    name: String!
    image: MediaSize!
  }

  type Media {
    id: ID!
    alt: String
    sizes: [MediaDetail!]
  }

  type Category {
    id: ID!
    name: String
    parentId: Int
    logoYellow: Media
    logoWhite: Media
    logoBlack: Media
  }

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
    settings: (_, __, { dataSources }) =>
      dataSources.wordpressBaseAPI.getSettings(),

    latestPostsWithSticky: (_, { number }, { dataSources }) =>
      dataSources.wordpressBaseAPI.getLatestPostsWithSticky(number),
    getLocations: (_, __, { dataSources }) =>
      dataSources.wordpressBaseAPI.getLocations(),
    getCategories: (_, __, { dataSources }) =>
      dataSources.wordpressBaseAPI.getCategories(),
    getMediaForCategories: (_, __, { dataSources }) =>
      dataSources.wordpressBaseAPI.getMediaForCategories(),
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

  Category: {
    logoYellow(parent, _, { dataSources }) {
      return dataSources.wordpressBaseAPI.getMediaById(parent.logoYellowId);
    },
    logoWhite(parent, _, { dataSources }) {
      return dataSources.wordpressBaseAPI.getMediaById(parent.logoWhiteId);
    },
    logoBlack(parent, _, { dataSources }) {
      return dataSources.wordpressBaseAPI.getMediaById(parent.logoBlackId);
    },
  },
};
