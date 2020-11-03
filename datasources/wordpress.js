import {RESTDataSource} from 'apollo-datasource-rest'
import he from 'he'

export default class WordpressAPI extends RESTDataSource {
    constructor() {
        super();
        this.baseURL = 'https://wordpress.lachouquette.ch/wp-json/wp/v2/';
    }

    async getSettings() {
        const settings = await this.get(`https://wordpress.lachouquette.ch/wp-json/`)

        return {
            name: settings.name,
            description: settings.description,
            url: settings.url
        }
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

    async getLocations() {
        const locations = await this.get(`locations`, {hide_empty: true, orderby: 'count', order: 'desc'})

        return locations.map(this.locationReducer)
    }

    async getCategories() {
        const categories = await this.get(`categories`)

        return categories.map(this.categoryReducer)
    }

    async getCategoryById(id) {
        const category = await this.get(`categories/${id}`)

        return this.categoryReducer(category)
    }

    async getMediaById(id) {
        const media = await this.get(`media/${id}`)

        return this.mediaReducer(media)
    }

    mediaReducer(media) {
        const mediaDTO = {
            id: media.id,
            alt: he.decode(media.alt_text),
            sizes: []
        }

        for (const [size, rawInfo] of Object.entries(media.media_details.sizes)) {
            mediaDTO.sizes.push({
                size,
                info: {
                    width: rawInfo.width,
                    height: rawInfo.height,
                    url: rawInfo.source_url
                }
            })
        }

        return mediaDTO
    }

    ficheReducer(post) {
        return {
            id: post.id,
            title: he.decode(post.title.rendered),
            topCategory: post.top_categories[0]
        }
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

    categoryReducer(category) {
        return {
            id: category.id,
            name: he.decode(category.name),
            parentId: category.parent,
            logoYellowId: category.logos.logo_yellow,
            logoWhiteId: category.logos.logo_white,
            logoBlackId: category.logos.logo_black,
        }
    }
}