const {RESTDataSource} = require('apollo-datasource-rest');
const he = require('he')

class WordpressAPI extends RESTDataSource {
    constructor() {
        super();
        this.baseURL = 'https://wordpress.lachouquette.ch/wp-json/wp/v2/';
    }

    async getLatestPostsWithSticky(number) {
        const posts = await this.get(`posts`, {sticky: true, per_page: number})
        const remainingPostCount = number - posts.length
        if (remainingPostCount) {
            const remainingPosts = await this.get(`posts`, {per_page: remainingPostCount})
            posts.push(...remainingPosts)
        }

        return posts.map(this.ficheReducer)
    }

    ficheReducer(post) {
        return {
            id: post.id,
            title: he.decode(post.title.rendered),
            topCategory: post.top_categories[0]
        }
    }

    async getCategoryById(id) {
        const category = await this.get(`categories/${id}`)

        return this.categoryReducer(category)
    }

    categoryReducer(category) {
        return {
            id: category.id,
            name: he.decode(category.name)
        }
    }

}

module.exports = WordpressAPI;