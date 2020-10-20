const {gql} = require('apollo-server-express');

const typeDefs = gql`
    type Fiche {
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

    type Query {
        hello: String
        fiche: Fiche
    }
`;

module.exports = typeDefs;