import dotenv from "dotenv";
import { merge } from "lodash";

import express from "express";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import cors from "cors";
import { ApolloServer, gql } from "apollo-server-express";
import { makeExecutableSchema } from "graphql-tools";
import responseCachePlugin from "apollo-server-plugin-response-cache";
import { BaseRedisCache } from "apollo-server-cache-redis";
import Redis from "ioredis";

// configure with env
dotenv.config();
const port = process.env.PORT || 4000;
const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT || 6379;
const redisPassword = process.env.REDIS_PASSWORD;

/* Import all typedefs */
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

// Queries
const Query = gql`
  type Query {
    # Wordpress API
    nuxtServerInit: NuxtServerInit!

    ficheBySlug(slug: String!): Fiche
    fichesByCategory(
      slug: String!
      location: String
      search: String
      criteria: [CriteriaSearch!]
      page: Int!
      pageSize: Int!
    ): FichesPage!
    fichesByText(text: String!, page: Int!): FichesPage!

    pageBySlug(slug: String!): Page

    postBySlug(slug: String!): Post
    latestPostsWithSticky(number: Int): [PostCard]
    postsByText(text: String!, page: Int!): PostsPage!

    criteriaByCategory(id: Int!): [Criteria!]

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
  }

  input CriteriaSearch {
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
    criteriaByCategory: (_, { id }, { dataSources }) =>
      dataSources.wordpressChouquetteAPI.getCriteriaForCategory(id),
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
  // TODO build redis cluster
  cache: new BaseRedisCache({
    client: new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
    }),
  }),
  plugins: [responseCachePlugin()],
  tracing: true,
  playground: true,
  introspection: true,
  cacheControl: {
    // TODO fix which default age for app...
    defaultMaxAge: 60,
  },
});

// Build express server
const app = express();
const router = express.Router();

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

// Setup health check
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Methods", "GET");
  next();
});
router.get("/health", (req, res) => {
  res.status(200).send("OK");
});
app.use("/", router);

server.applyMiddleware({ app });

app.listen({ port }, () =>
  console.log(
    `🚀 Server ready listening on port ${port} with enpoint ${server.graphqlPath}`
  )
);
