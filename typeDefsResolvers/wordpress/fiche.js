import { gql } from "apollo-server-express";
import lodash from "lodash";
import WordpressBaseAPI from "./baseEndpoint";

export const typeDefs = gql`
  type Fiche {
    id: ID!
    slug: String!
    title: String!
    date: String!
    content: String
    isChouquettise: Boolean! # computed
    address: String
    # ids (should be fetched once)
    principalCategoryId: Int
    categoryIds: [Int!]
    locationId: Int!
    # embedded
    info: FicheInfo
    image: Media
    criteria: [Criteria!]
    poi: FichePOI
    seo: Seo
    # external
    postCards: [PostCard!]
  }

  type FicheCategory {
    id: ID!
    slug: String!
    title: String!
    logo: String!
    markerIcon: String!
  }

  type FichePOI {
    address: String!
    street: String
    number: Int
    postCode: Int
    state: String
    city: String
    country: String
    lat: Float!
    lng: Float!
  }

  type FicheInfo {
    mail: String
    telephone: String
    website: String
    facebook: String
    instagram: String
    cost: Int
    openings: [String]
  }

  type CriteriaTerm {
    id: ID!
    slug: String!
    name: String
    description: String
  }

  type Criteria {
    id: ID!
    taxonomy: String!
    name: String
    values: [CriteriaTerm!]
  }
`;

export const resolvers = {
  Query: {
    ficheBySlug: (_, { slug }, { dataSources }) =>
      dataSources.wordpressFicheAPI.getFicheBySlug(slug),
  },

  Fiche: {
    image(parent) {
      return WordpressBaseAPI.mediaReducer(parent.featuredMedia);
    },
    criteria(parent) {
      return parent.criteria[0].flat();
    },
    seo(parent) {
      return parent;
    },
    postCards(parent, _, { dataSources }) {
      const postIds = parent.linkedPostIds.map(({ id }) => id);
      return lodash.isEmpty(postIds)
        ? null
        : dataSources.wordpressPostAPI.getPostCardByIds(postIds);
    },
  },
};
