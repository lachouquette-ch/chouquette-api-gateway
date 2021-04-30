import { gql } from "apollo-server-express";
import WordpressBaseAPI from "./baseEndpoint";

export const typeDefs = gql`
  type Post {
    id: ID!
    slug: String!
    title: String
    date: String!
    modified: String!
    content: String
    # ids (should be prefetched)
    categoryId: Int
    ficheIds: [Int!]
    # embedded
    image: Media
    tags: [Tag!]
    seo: Seo
    author: Author
    # external
    comments: [Comment!]
    similarPostCards: [PostCard!]
  }

  type PostCard {
    id: ID!
    slug: String!
    title: String
    categoryId: Int
    # embedded
    image: Media
  }

  type Comment {
    id: ID!
    parentId: Int!
    authorId: Int
    authorName: String
    authorAvatar: Avatar
    date: String
    content: String
  }
`;

export const resolvers = {
  Query: {
    postBySlug: (_, { slug }, { dataSources }) =>
      dataSources.wordpressPostAPI.getBySlug(slug),

    postCardsByIds: (_, { ids }, { dataSources }) =>
      dataSources.wordpressPostAPI.getPostCardByIds(ids),
  },

  Post: {
    comments(parent, _, { dataSources }) {
      return dataSources.wordpressBaseAPI.getCommentsByPostId(parent.id);
    },
    similarPostCards(parent, _, { dataSources }) {
      const tagIds = parent.tags.map(({ id }) => id);

      return dataSources.wordpressPostAPI.getPostCardByTagIds(
        tagIds,
        parent.id
      );
    },
  },
};
