import { gql } from "apollo-server-express";
import lodash from "lodash";

export const typeDefs = gql`
  type Fiche {
    id: ID!
    slug: String!
    title: String!
    date: String!
    content: String
    isChouquettise: Boolean! # computed
    address: String
    # ids (should be prefetched)
    principalCategoryId: Int
    categoryIds: [Int!]
    locationId: Int
    # embedded
    info: FicheInfo
    logo: FicheLogo
    image: Media
    criteria: [Criteria!]
    poi: FichePOI
    seo: Seo
    # external
    postCards: [PostCard!]
  }

  type FichesPage implements Pagination {
    fiches: [Fiche!]
    hasMore: Boolean!
    total: Int!
    totalPages: Int!
  }

  # TODO : use categoryId instead ?
  type FicheLogo {
    slug: String!
    name: String!
    url: String!
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

    marker: String!
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

  type Criteria {
    id: ID!
    taxonomy: String!
    name: String
    values: [CriteriaTerm!]
  }

  type CriteriaTerm {
    id: ID!
    slug: String!
    name: String
    description: String
  }
`;

export const resolvers = {
  Query: {
    ficheBySlug: (_, { slug }, { dataSources }) =>
      dataSources.wordpressFicheAPI.getBySlug(slug),

    fichesByCategory: (
      _,
      { slug, location, search, criteria, page, pageSize },
      { dataSources }
    ) =>
      dataSources.wordpressFicheAPI.getByCategorySlug(
        slug,
        page,
        pageSize,
        location,
        search,
        criteria
      ),

    fichesByText: (_, { text, page }, { dataSources }) =>
      dataSources.wordpressFicheAPI.searchFiches(text, page),
  },

  Mutation: {
    contactFicheOwner: async (
      _,
      { ficheId, name, email, message, recaptcha },
      { dataSources }
    ) => {
      await dataSources.wordpressFicheAPI.postContact(
        ficheId,
        name,
        email,
        message,
        recaptcha
      );
    },

    reportFicheInfo: async (
      _,
      { ficheId, name, email, message, recaptcha },
      { dataSources }
    ) => {
      await dataSources.wordpressFicheAPI.postReport(
        ficheId,
        name,
        email,
        message,
        recaptcha
      );
    },
  },

  Fiche: {
    postCards(parent, _, { dataSources }) {
      const postIds = parent.linkedPostIds.map(({ id }) => id);
      return lodash.isEmpty(postIds)
        ? null
        : dataSources.wordpressPostAPI.getPostCardByIds(postIds);
    },
  },
};
