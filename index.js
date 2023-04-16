/*
 * Copyright (c) 2023 by Fabrice Douchant <fabrice.douchant@gmail.com>.
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import dotenv from "dotenv";
import { merge } from "lodash";

import express from "express";
import compression from "compression";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import cors from "cors";
import { ApolloServer, gql } from "apollo-server-express";
import { makeExecutableSchema } from "graphql-tools";
import responseCachePlugin from "apollo-server-plugin-response-cache";
import { BaseRedisCache } from "apollo-server-cache-redis";
import Redis from "ioredis";
/* Import all typedefs */
import {
  resolvers as wordpressBaseResolvers,
  typeDefs as WordpressBase,
} from "./typeDefsResolvers/wordpress/base";
import {
  resolvers as wordpressFicheResolvers,
  typeDefs as WordpressFiche,
} from "./typeDefsResolvers/wordpress/fiche";
import {
  resolvers as wordpressPostResolvers,
  typeDefs as WordpressPost,
} from "./typeDefsResolvers/wordpress/post";
import {
  resolvers as wordpressPageResolvers,
  typeDefs as WordpressPage,
} from "./typeDefsResolvers/wordpress/page";
import {
  resolvers as wordpressMenuResolvers,
  typeDefs as WordpressMenu,
} from "./typeDefsResolvers/wordpress/menu";
import { typeDefs as WordpressYoast } from "./typeDefsResolvers/wordpress/yoast";

import WordpressBaseAPI from "./typeDefsResolvers/wordpress/baseEndpoint";
import WordpressFicheAPI from "./typeDefsResolvers/wordpress/ficheEndpoint";
import WordpressPostAPI from "./typeDefsResolvers/wordpress/postEndpoint";
import WordpressPageAPI from "./typeDefsResolvers/wordpress/pageEndpoint";
import WordpressChouquetteAPI from "./typeDefsResolvers/wordpress/chouquetteEndpoint";
import WordpressMenuAPI from "./typeDefsResolvers/wordpress/menuEndpoint";
import WordpressYoastAPI from "./typeDefsResolvers/wordpress/yoastEndpoint";
// Setup ready check by calling the graphql api as a client
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client/core";
import fetch from "cross-fetch";

// configure with env
dotenv.config();
const port = process.env.PORT || 4000;
const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT || 6379;
const redisPassword = process.env.REDIS_PASSWORD;

// Queries
const Query = gql`
  type Query {
    # Wordpress API
    nuxtServerInit: NuxtServerInit!

    ficheBySlug(slug: String!): Fiche
    fichesByFilters(
      category: String
      location: String
      search: String
      chouquettiseOnly: Boolean
      categoryFilters: [TaxonomyFilter!]
      page: Int!
      pageSize: Int!
    ): FichesPage!
    fichesByText(text: String!, page: Int!): FichesPage!

    pageBySlug(slug: String!): Page

    postBySlug(slug: String!): Post
    latestPostsWithSticky(number: Int): [PostCard]
    postsByFilters(
      category: String
      search: String
      asc: Boolean
      topOnly: Boolean
      page: Int!
      pageSize: Int!
    ): PostsPage!
    postsByText(text: String!, page: Int!): PostsPage!

    filtersByCategory(id: Int!): [CategoryFilter!]

    home: Home!
    team: Team!
  }

  type Mutation {
    reportFicheInfo(
      ficheId: Int!
      name: String!
      email: String!
      message: String!
      recaptcha: String!
    ): String

    contactFicheOwner(
      ficheId: Int!
      name: String!
      email: String!
      message: String!
      recaptcha: String!
    ): String

    contactStaff(
      name: String!
      email: String!
      subject: String!
      to: String!
      message: String!
      recaptcha: String!
    ): String

    commentPost(
      postId: Int!
      parentId: Int
      authorName: String!
      authorEmail: String!
      content: String!
      recaptcha: String!
    ): String
  }

  input TaxonomyFilter {
    taxonomy: String!
    values: [String!]
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

const Resolver = {
  Query: {
    filtersByCategory: (_, { id }, { dataSources }) =>
      dataSources.wordpressChouquetteAPI.getFiltersForCategory(id),
  },
};

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
    Resolver,
    wordpressBaseResolvers,
    wordpressFicheResolvers,
    wordpressPostResolvers,
    wordpressPageResolvers,
    wordpressMenuResolvers
  ),
});

// Build Apollo Server
let cache = null;
if (process.env.NODE_ENV === "production") {
  cache = {
    cache: new BaseRedisCache({
      client: new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
      }),
    }),
  };
} else {
  cache = { plugins: [responseCachePlugin()] };
}

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
  tracing: true,
  playground: true,
  introspection: true,
  cacheControl: {
    // TODO fix which default age for app...
    defaultMaxAge: 60,
  },
  ...cache,
});

// Build express server
const app = express();
const router = express.Router();

// configure compression
app.use(compression());
// configure cors
app.use(cors()); // TODO better restrict CORS origins
// configure speedlimit
const speedLimit = slowDown({
  windowMs: 5 * 60 * 100, // 5 minutes window
  delayAfter: 10, // after 10 requests
  delayMs: 100, // add 100ms each request
  maxDelayMs: 5000, // to max 5 seconds of delay
});
app.use(speedLimit); // TODO fine tune slow down
// configure ratelimit
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 25, // limit to 25 requests
});
app.use(limiter); // TODO fine tune rate timit

server.applyMiddleware({ app });

// Setup health check
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});
const client = new ApolloClient({
  link: new HttpLink({ uri: `http://localhost:${port}/graphql`, fetch }),
  cache: new InMemoryCache(),
});
app.get("/ready", async (req, res) => {
  const result = await client.query({
    query: gql`
      query {
        nuxtServerInit {
          settings {
            name
            description
            url
          }
        }
      }
    `,
  });
  res.status(200).send(result.data.nuxtServerInit);
});

app.listen({ port }, () =>
  console.log(
    `🚀 Server ready listening on port ${port} with enpoint ${server.graphqlPath}`
  )
);
