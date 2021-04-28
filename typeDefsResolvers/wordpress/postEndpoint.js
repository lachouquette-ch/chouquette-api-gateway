import { RESTDataSource } from "apollo-datasource-rest";
import he from "he";
import _ from "lodash";

export default class WordpressPostAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = "https://wordpress.lachouquette.ch/wp-json/wp/v2/";
  }

  async getByIds(path, ids, queryParams = {}) {
    queryParams = {
      include: ids.join(","),
      per_page: ids.length,
      ...queryParams,
    };
    return this.get(path, queryParams);
  }

  async getPostCardByIds(ids) {
    const DEFAULT_FIELDS = [
      "id",
      "slug",
      "title",
      "categories",
      "top_categories",
      "featured_media",
    ];

    const postCards = await this.getByIds(`posts`, ids, {
      _fields: DEFAULT_FIELDS.join(","),
    });

    return postCards.map(this.postCardReducer);
  }

  postCardReducer(postCard) {
    return {
      id: postCard.id,
      slug: postCard.slug,
      title: he.decode(postCard.title.rendered),
      featured_media: postCard.featured_media,
      categoryId: postCard.top_categories[0],
    };
  }

  async getLatestPostsWithSticky(number) {
    const posts = await this.get(`posts`, { sticky: true, per_page: number });
    const remainingPostCount = number - posts.length;
    if (remainingPostCount) {
      const remainingPosts = await this.get(`posts`, {
        per_page: remainingPostCount,
      });
      posts.push(...remainingPosts);
    }

    return posts.map(this.ficheReducer);
  }
}
