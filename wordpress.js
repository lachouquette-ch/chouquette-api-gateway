import { gql } from 'apollo-server-express'

export const typeDefs = gql`
    type Settings @cacheControl(maxAge: 14400) {
        name: String
        description: String
        url: String
    }
    
    type Location @cacheControl(maxAge: 7200) {
        id: ID!
        parentId: Int
        name: String
        slug: String
        description: String
    }
    
    type Fiche {
        id: ID!
        title: String!
        slug: String!
        date: String! # date format
        description: String # content
        isChouquettise: Boolean! # computed
        endOfChouquettisation: String # chouquettise_end, date format
        address: String # location.address
        # location.position
        localisation: String # localisation.name
        categories: [String!]
        criteria: [String!] # criteria.term_name
        tags: [String!] # tags.name
    }
    
    type MediaInfo @cacheControl(maxAge: 7200) {
        width: Int!
        height: Int!
        url: String!
    }
    
    type MediaDetail @cacheControl(maxAge: 7200) {
        size: String!
        info: MediaInfo!
    }
    
    type Media @cacheControl(maxAge: 7200) {
        id: ID!
        alt: String
        sizes: [MediaDetail!]
    }
    
    type Category @cacheControl(maxAge: 7200) {
        id: ID!
        name: String
        logoYellow: Media
        logoWhite: Media
        logoBlack: Media
    }
    
    type Post {
        id: ID!
        title: String
        cover: Media
        category: Category
    }
`;

export const resolvers = {
    Query: {
        latestPostsWithSticky: (_, {number}, {dataSources}) => dataSources.wordpressAPI.getLatestPostsWithSticky(number),
        getLocations: (_, __, {dataSources}) => dataSources.wordpressAPI.getLocations(),
        getSettings: (_, __, {dataSources}) => dataSources.wordpressAPI.getSettings(),
        getCategories: (_, __, {dataSources}) => dataSources.wordpressAPI.getCategories()
    },

    Category: {
        logoYellow(parent, _, {dataSources}) {
            return dataSources.wordpressAPI.getMediaById(parent.logoYellowId)
        },
        logoWhite(parent, _, {dataSources}) {
            return dataSources.wordpressAPI.getMediaById(parent.logoWhiteId)
        },
        logoBlack(parent, _, {dataSources}) {
            return dataSources.wordpressAPI.getMediaById(parent.logoBlackId)
        },
    },

    Post: {
        cover(parent) {
            return {
                id: 0
            }
        },
        category(parent, _, {dataSources}) {
            return dataSources.wordpressAPI.getCategoryById(parent.topCategory)
        }
    }
}