import { gql } from 'apollo-server-express'

export const typeDefs = gql`
    type Location {
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
    
    enum MediaSize {
        thumbnail, medium, medium_large, large, full
    }
    
    type MediaInfo {
        width: Int!
        height: Int!
        source_url: String!
    }
    
    type MediaDetail {
        MediaSize: MediaInfo
    }
    
    type Media {
        id: ID!
        alt: String
        sizes: [MediaDetail!]
    }
    
    type Category {
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
        getLocations: (_, __, {dataSources}) => dataSources.wordpressAPI.getLocations()
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