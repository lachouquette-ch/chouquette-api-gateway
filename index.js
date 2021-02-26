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
  typeDefs as Menu,
  resolvers as menuResolvers,
} from "./typeDefsResolvers/wordpress/menu";
import {
  typeDefs as Yoast,
  resolvers as yoastResolvers,
} from "./typeDefsResolvers/wordpress/yoast";

import WordpressBaseAPI from "./datasources/wordpress/base";
import WordpressFicheAPI from "./datasources/wordpress/fiche";
import WordpressPostAPI from "./datasources/wordpress/post";
import WordpressChouquetteAPI from "./datasources/wordpress/chouquette";
import MenuAPI from "./datasources/wordpress/menu";
import YoastAPI from "./datasources/wordpress/yoast";

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
  typeDefs: [Query, WordpressBase, WordpressFiche, WordpressPost, Menu, Yoast],
  resolvers: merge(
    resolvers,
    wordpressBaseResolvers,
    wordpressFicheResolvers,
    wordpressPostResolvers,
    menuResolvers,
    yoastResolvers
  ),
});

const server = new ApolloServer({
  schema,
  dataSources: () => ({
    wordpressBaseAPI: new WordpressBaseAPI(),
    wordpressFicheAPI: new WordpressFicheAPI(),
    wordpressPostAPI: new WordpressPostAPI(),
    wordpressChouquetteAPI: new WordpressChouquetteAPI(),
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
