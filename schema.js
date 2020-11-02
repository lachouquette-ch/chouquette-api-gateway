const {gql} = require('apollo-server-express');

const typeDefs = gql`
    # TO RESOLVE CACHE CONTROL
    directive @cacheControl(
        maxAge: Int,
        scope: CacheControlScope
    ) on OBJECT | FIELD_DEFINITION
    
    enum CacheControlScope {
        PUBLIC
        PRIVATE
    }
    
    # Caching values
    # 4 hours = 14400 / 2 hours = 7200 / 1 hours = 3600 / 30 min = 1800 / 5 min = 300  
    
    type Menu {
        id: ID!
        name: String!
        slug: String!
        items: [MenuItem!] @cacheControl(maxAge: 14400)
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
        getMenus: [Menu!] @cacheControl(maxAge: 14400)
        getRedirects: [Redirect!] @cacheControl(maxAge: 14400)
    }
`;

module.exports = typeDefs;