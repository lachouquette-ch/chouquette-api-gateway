import { gql } from "apollo-server-express";

export const typeDefs = gql`
  type NuxtServerInit {
    settings: Settings!
    redirects: [Redirect!]
    menus: [Menu!]
    categories: [Category!]
    locations: [Location!]
  }

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
    source: String
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

  type Author {
    id: ID!
    slug: String!
    name: String
    description: String
    avatar: Avatar
  }

  type Avatar {
    size24: String!
    size48: String!
    size96: String!
  }
`;

export const resolvers = {
  Query: {
    nuxtServerInit(parent, _, { dataSources }) {
      return {};
    },
  },

  NuxtServerInit: {
    settings(parent, _, { dataSources }) {
      return dataSources.wordpressBaseAPI.getSettings();
    },
    redirects(parent, _, { dataSources }) {
      return dataSources.wordpressYoastAPI.getRedirects();
    },
    menus(parent, _, { dataSources }) {
      return dataSources.wordpressMenuAPI.getMenus();
    },
    async categories(parent, _, { dataSources }) {
      const categories = await dataSources.wordpressBaseAPI.getCategories();
      const media = await dataSources.wordpressBaseAPI.getMediaForCategories(
        categories
      );

      for (let category of categories) {
        category.logoYellow = category.logoYellowId
          ? media.find(({ id }) => id === category.logoYellowId)
          : null;
        category.logoWhite = category.logoWhiteId
          ? media.find(({ id }) => id === category.logoWhiteId)
          : null;
        category.logoBlack = category.logoBlackId
          ? media.find(({ id }) => id === category.logoBlackId)
          : null;
      }

      return categories;
    },
    locations(parent, _, { dataSources }) {
      return dataSources.wordpressBaseAPI.getLocations();
    },
  },
};
