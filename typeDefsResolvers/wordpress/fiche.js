/*
 * Copyright (c) 2023 by Fabrice Douchant <fabrice.douchant@gmail.com>.
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

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
    valueIds: [Int!]
    # embedded
    info: FicheInfo
    logo: FicheLogo
    image: Media
    categoryFilters: [CategoryFilter!]
    poi: FichePOI
    seo: Seo
    # external
    postCards: [PostCard!]
    similarFiches: [FicheCard!]
  }

  type FicheCard {
    id: ID!
    slug: String!
    title: String
    content: String
    isChouquettise: Boolean! # computed
    # ids (should be prefetched)
    principalCategoryId: Int
    locationId: Int
    valueIds: [Int!]
    # embedded
    image: Media
    poi: FichePOI
  }

  type FichesPage implements Pagination {
    fiches: [FicheCard!]
    hasMore: Boolean!
    total: Int!
    totalPages: Int!
  }

  # TODO : use categoryId instead ?
  type FicheLogo {
    slug: String!
    name: String!
    url: String
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

  type CategoryFilter {
    id: ID!
    taxonomy: String!
    name: String
    values: [FilterTerm!]
  }

  type FilterTerm {
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

    fichesByFilters: (
      _,
      {
        category,
        location,
        search,
        chouquettiseOnly,
        categoryFilters,
        page,
        pageSize,
      },
      { dataSources }
    ) =>
      dataSources.wordpressFicheAPI.getCardsByFilters(
        category,
        location,
        search,
        chouquettiseOnly,
        categoryFilters,
        page,
        pageSize
      ),

    fichesByText: (_, { text, page }, { dataSources }) =>
      dataSources.wordpressFicheAPI.getCardsBySearchText(text, page),
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

    similarFiches(parent, _, { dataSources }) {
      return dataSources.wordpressFicheAPI.getCardsByTagIds(
        parent.tagIds,
        parent.id
      );
    },
  },
};
