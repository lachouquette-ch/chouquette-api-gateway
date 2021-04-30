import { RESTDataSource } from "apollo-datasource-rest";
import he from "he";
import _ from "lodash";
import WordpressBaseAPI from "./baseEndpoint";
import YoastAPI from "./yoastEndpoint";

const POST_CARD_FIELDS = [
  "id",
  "slug",
  "title",
  "categories",
  "top_categories",
  "featured_media",
  "_links.wp:featuredmedia",
];

export default class WordpressPostAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = "https://wordpress.lachouquette.ch/wp-json/wp/v2/posts";
  }

  async getBySlug(slug) {
    const result = await this.get("", { slug, _embed: true });

    if (_.isEmpty(result)) {
      return null;
    }
    const post = result[0];

    return {
      id: post.id,
      slug,
      title: he.decode(post.title.rendered),
      date: new Date(post.date).toISOString(),
      modified: new Date(post.modified).toISOString(),
      content: he.decode(post.content.rendered),

      ficheIds: post.meta.link_fiche,

      // embedded
      image: WordpressBaseAPI.mediaReducer(
        post._embedded["wp:featuredmedia"][0]
      ),
      author: WordpressBaseAPI.authorReducer(post._embedded.author[0]),
      tags: post._embedded["wp:term"]
        .flat()
        .filter((term) => term.taxonomy === "post_tag"),
      seo: YoastAPI.seoReducer(post),
    };
  }

  async getPostCardByIds(ids) {
    const postCards = await this.get(
      "",
      WordpressBaseAPI.queryParamBuilderForIds(ids, {
        _fields: POST_CARD_FIELDS.join(","),
        _embed: "wp:featuredmedia",
      })
    );

    return postCards.map(this.postCardReducer, this);
  }

  async getPostCardByTagIds(ids, postId = null) {
    const postCards = await this.get("", {
      tags: ids,
      exclude: postId,
      per_page: 6,
      _fields: POST_CARD_FIELDS.join(","),
      _embed: "wp:featuredmedia",
    });

    return postCards.map(this.postCardReducer, this);
  }

  postCardReducer(postCard) {
    return {
      id: postCard.id,
      slug: postCard.slug,
      title: he.decode(postCard.title.rendered),
      categoryId: postCard.top_categories[0],

      // embedded
      image: WordpressBaseAPI.mediaReducer(
        postCard._embedded["wp:featuredmedia"][0]
      ),
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
