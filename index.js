import dotenv from "dotenv";
import { merge } from "lodash";

import express from "express";
import cors from "cors";
import { ApolloServer, gql } from "apollo-server-express";
import { makeExecutableSchema } from "graphql-tools";
import responseCachePlugin from "apollo-server-plugin-response-cache";

import {
  typeDefs as WordpressBase,
  resolvers as wordpressBaseResolvers,
} from "./typeDefsResolvers/wordpress/base";
import {
  typeDefs as WordpressFiche,
  resolvers as wordpressFicheResolvers,
} from "./typeDefsResolvers/wordpress/fiche";
import {
  typeDefs as WordpressPost,
  resolvers as wordpressPostResolvers,
} from "./typeDefsResolvers/wordpress/post";
import {
  typeDefs as WordpressPage,
  resolvers as wordpressPageResolvers,
} from "./typeDefsResolvers/wordpress/page";
import {
  typeDefs as WordpressMenu,
  resolvers as wordpressMenuResolvers,
} from "./typeDefsResolvers/wordpress/menu";
import { typeDefs as WordpressYoast } from "./typeDefsResolvers/wordpress/yoast";

import WordpressBaseAPI from "./typeDefsResolvers/wordpress/baseEndpoint";
import WordpressFicheAPI from "./typeDefsResolvers/wordpress/ficheEndpoint";
import WordpressPostAPI from "./typeDefsResolvers/wordpress/postEndpoint";
import WordpressPageAPI from "./typeDefsResolvers/wordpress/pageEndpoint";
import WordpressChouquetteAPI from "./typeDefsResolvers/wordpress/chouquetteEndpoint";
import WordpressMenuAPI from "./typeDefsResolvers/wordpress/menuEndpoint";
import WordpressYoastAPI from "./typeDefsResolvers/wordpress/yoastEndpoint";

dotenv.config();

// Queries
const Query = gql`
  type Query {
    # Wordpress API
    nuxtServerInit: NuxtServerInit!

    ficheBySlug(slug: String!): Fiche
    pageBySlug(slug: String!): Page
    postBySlug(slug: String!): Post

    home: Home!

    ficheByIds(ids: [Int!]!): [Fiche]
    postCardsByIds(ids: [Int!]!): [PostCard]

    latestPostsWithSticky(number: Int): [PostCard]
    getMediaForCategories: [Media!]
  }

  # TO RESOLVE CACHE CONTROL
  directive @cacheControl(
    maxAge: Int
    scope: CacheControlScope
  ) on OBJECT | FIELD_DEFINITION

  enum CacheControlScope {
    PUBLIC
    PRIVATE
  }
`;

const resolvers = {};

const schema = makeExecutableSchema({
  typeDefs: [
    Query,
    WordpressBase,
    WordpressFiche,
    WordpressPost,
    WordpressPage,
    WordpressMenu,
    WordpressYoast,
  ],
  resolvers: merge(
    resolvers,
    wordpressBaseResolvers,
    wordpressFicheResolvers,
    wordpressPostResolvers,
    wordpressPageResolvers,
    wordpressMenuResolvers
  ),
});

const server = new ApolloServer({
  schema,
  dataSources: () => ({
    wordpressBaseAPI: new WordpressBaseAPI(),
    wordpressFicheAPI: new WordpressFicheAPI(),
    wordpressPostAPI: new WordpressPostAPI(),
    wordpressPageAPI: new WordpressPageAPI(),
    wordpressChouquetteAPI: new WordpressChouquetteAPI(),
    wordpressMenuAPI: new WordpressMenuAPI(),
    wordpressYoastAPI: new WordpressYoastAPI(),
  }),
  plugins: [responseCachePlugin()],
  // tracing: true,
  cacheControl: {
    // TODO fix which default age for app...
    // defaultMaxAge: 60,
  },
});

const app = express();
// TODO better restrict CORS origins
app.use(cors());
server.applyMiddleware({ app });

app.listen({ port: 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
);
