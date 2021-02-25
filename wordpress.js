import { gql } from "apollo-server-express";
import lodash from "lodash";

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

  type Criteria {
    id: ID!
    slug: String!
    name: String
    description: String
  }

  type CriteriaType {
    id: ID!
    taxonomy: String!
    name: String
    values: Criteria
  }

  type POI {
    street: String!
    number: Int
    postCode: Int!
    state: String
    city: String!
    country: String!
    lat: Float
    lng: Float
  }

  type ChouquettiseInfo {
    mail: String
    telephone: String
    website: String
    facebook: String
    instagram: String
    cost: Int
    openings: [Opening]
  }

  type Opening {
    dayOfWeek: Int
    opening: String
  }

  type Fiche {
    id: ID!
    slug: String!
    title: String!
    date: String! # date format
    content: String # content
    address: String # location.address
    isChouquettise: Boolean! # computed
    poi: POI
    info: ChouquettiseInfo

    image: Media
    criteria: [Criteria!]

    # location.position
    localisation: String # localisation.name
    # postCards: [PostCard!]
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
    parentId: Int!
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
      dataSources.wordpressAPI.getSettings(),
    ficheBySlug: (_, { slug }, { dataSources }) =>
      dataSources.wordpressAPI.getFicheBySlug(slug),

    latestPostsWithSticky: (_, { number }, { dataSources }) =>
      dataSources.wordpressAPI.getLatestPostsWithSticky(number),
    getLocations: (_, __, { dataSources }) =>
      dataSources.wordpressAPI.getLocations(),
    getCategories: (_, __, { dataSources }) =>
      dataSources.wordpressAPI.getCategories(),
    getMediaForCategories: (_, __, { dataSources }) =>
      dataSources.wordpressAPI.getMediaForCategories(),
  },

  Fiche: {
    image(parent, _, { dataSources }) {
      const media = parent.featured_media
        ? dataSources.wordpressAPI.getMediaById(parent.featured_media)
        : null;

      return media;
    },
    criteria(parent, _, { dataSources }) {
      return dataSources.wordpressAPI.getCriteriaForFiche(parent.id);
    },
    // postCards(parent, _, { dataSources }) {
    //   const postCardIds = parent.linked_posts.map(({ id }) => id);
    //
    //   return lodash.isEmpty(postCardIds)
    //     ? null
    //     : dataSources.wordpressAPI.getPostCardByIds(postCardIds);
    // },
  },

  PostCard: {
    cover(parent, _, { dataSources }) {
      return dataSources.wordpressAPI.getMediaById(parent.featured_media);
    },
    categories(parent, _, { dataSources }) {
      return dataSources.wordpressAPI.getCategoryByIds(parent.top_categories);
    },
  },

  Category: {
    logoYellow(parent, _, { dataSources }) {
      return dataSources.wordpressAPI.getMediaById(parent.logoYellowId);
    },
    logoWhite(parent, _, { dataSources }) {
      return dataSources.wordpressAPI.getMediaById(parent.logoWhiteId);
    },
    logoBlack(parent, _, { dataSources }) {
      return dataSources.wordpressAPI.getMediaById(parent.logoBlackId);
    },
  },
};
