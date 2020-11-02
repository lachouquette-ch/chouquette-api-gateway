const {gql} = require('apollo-server-express');

exports.typeDefs = gql`
    type Query {
        latestPostsWithSticky(number: Int): [Post]
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

exports.resolvers = {
    Query: {
        latestPostsWithSticky: (_, {number}, {dataSources}) => dataSources.wordpressAPI.getLatestPostsWithSticky(number),
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