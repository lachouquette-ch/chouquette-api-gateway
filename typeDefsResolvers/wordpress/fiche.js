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
    locationId: Int!
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
      dataSources.wordpressFicheAPI.getBySlug(slug),

    ficheByIds: (_, { ids }, { dataSources }) =>
      dataSources.wordpressFicheAPI.getByIds(ids),

    fichesByCategory: (
      _,
      { slug, page, pageSize, locationId, search },
      { dataSources }
    ) =>
      dataSources.wordpressFicheAPI.getByCategorySlug(
        slug,
        page,
        pageSize,
        locationId,
        search
      ),
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
