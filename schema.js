const {gql} = require('apollo-server-express');

const typeDefs = gql`
    type Menu {
        id: ID!
        name: String!
        slug: String!
        items: [MenuItem!]
    }
    
    enum MenuItemType {
        page, category
    }
    
    type MenuItem {
        id: ID!
        type: MenuItemType!
        slug: String!
        url: String
    }
    
    type Redirect {
        from: String!
        to: String!
        status: Int!
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

    type Query {
        latestPostsWithSticky(number: Int): [Post]
        getMenus: [Menu!]
        getRedirects: [Redirect!]
    }
`;

module.exports = typeDefs;