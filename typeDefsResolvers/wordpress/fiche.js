import { gql } from "apollo-server-express";

export const typeDefs = gql`
  type Fiche {
    id: ID!
    slug: String!
    title: String!
    date: String!
    content: String
    address: String
    isChouquettise: Boolean! # computed
    poi: FichePOI
    info: FicheInfo
    categoryId: Int! # should be fetched once
    locationId: Int! # should be fetched once
    image: Media
    criteria: [FicheCriteria!]

    # postCards: [PostCard!]
  }

  type FichePOI {
    street: String!
    number: Int
    postCode: Int!
    state: String
    city: String!
    country: String!
    lat: Float
    lng: Float
  }

  type FicheInfo {
    mail: String
    telephone: String
    website: String
    facebook: String
    instagram: String
    cost: Int
    openings: [FicheOpening]
  }

  type FicheOpening {
    dayOfWeek: Int
    opening: String
  }

  type FicheCriteria {
    id: ID!
    slug: String!
    name: String
    description: String
  }

  type FicheCriteriaType {
    id: ID!
    taxonomy: String!
    name: String
    values: FicheCriteria
  }
`;

export const resolvers = {
  Query: {
    ficheBySlug: (_, { slug }, { dataSources }) =>
      dataSources.wordpressFicheAPI.getFicheBySlug(slug),
  },

  Fiche: {
    image(parent, _, { dataSources }) {
      const media = parent.featured_media
        ? dataSources.wordpressBaseAPI.getMediaById(parent.featured_media)
        : null;

      return media;
    },
    criteria(parent, _, { dataSources }) {
      return dataSources.wordpressChouquetteAPI.getCriteriaForFiche(parent.id);
    },
    // postCards(parent, _, { dataSources }) {
    //   const postCardIds = parent.linked_posts.map(({ id }) => id);
    //
    //   return lodash.isEmpty(postCardIds)
    //     ? null
    //     : dataSources.wordpressAPI.getPostCardByIds(postCardIds);
    // },
  },
};
