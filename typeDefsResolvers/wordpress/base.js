import { gql } from "apollo-server-express";

export const typeDefs = gql`
  type NuxtServerInit {
    settings: Settings!
    redirects: [Redirect!]
    categories: [Category!]
    menus: [Menu!]
    locations: [Location!]
  }

  type Home {
    latestPosts: [PostCard!]
    latestChouquettises: [Fiche!]
    topPosts: [PostCard!]
    seo: Seo
  }

  type Team {
    page: Page!
    authors: [Author!]
  }

  interface Pagination {
    hasMore: Boolean!
    total: Int!
    totalPages: Int!
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
    slug: String!
    name: String
    description: String
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
    avatar: String
  }

  type Tag {
    id: ID!
    slug: String!
    name: String
  }
`;

export const resolvers = {
  Query: {
    nuxtServerInit() {
      return {};
    },
    home() {
      return {};
    },
    team() {
      return {};
    },
  },

  Mutation: {
    contactStaff: async (
      _,
      { name, email, subject, to, message, recaptcha },
      { dataSources }
    ) => {
      await dataSources.wordpressChouquetteAPI.postContact(
        name,
        email,
        subject,
        to,
        message,
        recaptcha
      );
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
      const mediaList = await dataSources.wordpressBaseAPI.getMediaForCategories(
        categories
      );

      for (let category of categories) {
        category.logoYellow = category.logoYellowId
          ? mediaList.find(({ id }) => id === category.logoYellowId)
          : null;
        category.logoWhite = category.logoWhiteId
          ? mediaList.find(({ id }) => id === category.logoWhiteId)
          : null;
        category.logoBlack = category.logoBlackId
          ? mediaList.find(({ id }) => id === category.logoBlackId)
          : null;
      }

      return categories;
    },
    locations(parent, _, { dataSources }) {
      return dataSources.wordpressBaseAPI.getLocations();
    },
  },

  Home: {
    latestPosts(parent, _, { dataSources }) {
      return dataSources.wordpressPostAPI.getLatestPosts(4);
    },
    latestChouquettises(parent, _, { dataSources }) {
      return dataSources.wordpressFicheAPI.getLatestChouquettises(5);
    },
    topPosts(parent, _, { dataSources }) {
      return dataSources.wordpressPostAPI.getTopPostCards(5);
    },
    seo(parent, _, { dataSources }) {
      return dataSources.wordpressYoastAPI.getHome();
    },
  },

  Team: {
    page(parent, _, { dataSources }) {
      return dataSources.wordpressPageAPI.getBySlug("equipe");
    },
    authors(parent, _, { dataSources }) {
      return dataSources.wordpressBaseAPI.getTeam();
    },
  },
};
