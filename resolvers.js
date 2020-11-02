module.exports = {
    Query: {
        latestPostsWithSticky: (_, {number}, {dataSources}) => dataSources.wordpressAPI.getLatestPostsWithSticky(number),
        getMenus: (_, __, {dataSources}) => dataSources.menuAPI.getMenus(),
        getRedirects: (_, __, {dataSources}) => dataSources.yoastAPI.getRedirects()
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