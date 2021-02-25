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
} from "./wordpress_base";
import {
  typeDefs as WordpressFiche,
  resolvers as wordpressFicheResolvers,
} from "./wordpress_fiche";
import { typeDefs as Menu, resolvers as menuResolvers } from "./menu";
import { typeDefs as Yoast, resolvers as yoastResolvers } from "./yoast";

import WordpressBaseAPI from "./datasources/wordpress_base";
import WordpressFicheAPI from "./datasources/wordpress_fiche";
import MenuAPI from "./datasources/menu";
import YoastAPI from "./datasources/yoast";

dotenv.config();

// Default
const Query = gql`
  type Query {
    # Wordpress API
    settings: Settings
    ficheBySlug(slug: String!): Fiche

    latestPostsWithSticky(number: Int): [PostCard]
    getLocations: [Location!]
    getCategories: [Category!]
    getMediaForCategories: [Media!]

    # Menu API
    menus: [Menu!]
    menu: Menu

    # Yoast API
    getRedirects: [Redirect!]
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
  typeDefs: [Query, WordpressBase, WordpressFiche, Menu, Yoast],
  resolvers: merge(
    resolvers,
    wordpressBaseResolvers,
    wordpressFicheResolvers,
    menuResolvers,
    yoastResolvers
  ),
});

const server = new ApolloServer({
  schema,
  dataSources: () => ({
    wordpressBaseAPI: new WordpressBaseAPI(),
    wordpressFicheAPI: new WordpressFicheAPI(),
    menuAPI: new MenuAPI(),
    yoastAPI: new YoastAPI(),
  }),
  plugins: [responseCachePlugin()],
  // tracing: true,
  cacheControl: {
    defaultMaxAge: 60,
  },
});

const app = express();
// TODO better restrict CORS origins
app.use(cors());
server.applyMiddleware({ app });

app.listen({ port: 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
);
