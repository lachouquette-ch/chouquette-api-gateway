import {RESTDataSource} from 'apollo-datasource-rest'
import he from 'he'

export default class WordpressAPI extends RESTDataSource {
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

    async getLocations() {
        const locations = await this.get(`locations`, {hide_empty: true, orderby: 'count', order: 'desc'})

        return locations.map(this.locationReducer)
    }

    locationReducer(location) {
        return {
            id: location.id,
            parentId: location.parent,
            name: location.name,
            slug: location.slug,
            description: location.slug
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