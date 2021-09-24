import {gql} from "apollo-server-express";
import lodash from "lodash";

export const typeDefs = gql`
  type Post {
    id: ID!
    slug: String!
    title: String
    date: String!
    modified: String!
    content: String
    isTop: Boolean!
    # ids (should be prefetched)
    categoryId: Int
    ficheIds: [Int!]
    # embedded
    image: Media
    tags: [Tag!]
    seo: Seo
    authors: [Author]
    # external
    ficheCards: [FicheCard!]
    comments: [Comment!]
    similarPosts: [PostCard!]
  }

  type PostCard {
    id: ID!
    slug: String!
    title: String
    date: String
    authorName: String
    isTop: Boolean!
    # ids
    categoryId: Int
    # embedded
    image: Media
  }

  type Comment {
    id: ID!
    parentId: Int!
    authorId: Int
    authorName: String
    authorAvatar: String
    date: String
    content: String
  }

  type PostsPage implements Pagination {
    postCards: [PostCard!]
    hasMore: Boolean!
    total: Int!
    totalPages: Int!
  }
`;

export const resolvers = {
  Query: {
    postBySlug: (_, { slug }, { dataSources }) =>
      dataSources.wordpressPostAPI.getBySlug(slug),

    postsByFilters: (
      _,
      { category, search, page, pageSize, asc, topOnly },
      { dataSources }
    ) =>
      dataSources.wordpressPostAPI.findPosts(
        category,
        search,
        asc,
        topOnly,
        page,
        pageSize
      ),

    postsByText: (_, { text, page }, { dataSources }) =>
      dataSources.wordpressPostAPI.findPosts(null, text, false, page),
  },

  Post: {
    ficheCards(parent, _, { dataSources }) {
      return !lodash.isEmpty(parent.ficheIds)
        ? dataSources.wordpressFicheAPI.getCardsByIds(parent.ficheIds)
        : null;
    },
    comments(parent, _, { dataSources }) {
      return dataSources.wordpressBaseAPI.getCommentsByPostId(parent.id);
    },
    similarPosts(parent, _, { dataSources }) {
      const tagIds = parent.tags.map(({ id }) => id);

      return dataSources.wordpressPostAPI.getPostCardByTagIds(
        tagIds,
        parent.id
      );
    },
  },
};
