module.exports = {
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