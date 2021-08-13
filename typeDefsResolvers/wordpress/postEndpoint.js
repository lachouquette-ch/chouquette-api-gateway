import he from "he";
import _ from "lodash";
import WordpressBaseAPI from "./baseEndpoint";
import YoastAPI from "./yoastEndpoint";
import WordpresRESTDataSource from "../WordpresRESTDataSource";

const POST_CARD_FIELDS = [
  "id",
  "slug",
  "title",
  "categories",
  "top_categories",
  "featured_media",
  "_links.wp:featuredmedia",
];

const TOPS_TAG_ID = 1246;

export default class WordpressPostAPI extends WordpresRESTDataSource {
  constructor() {
    super();
    this.baseURL = `${process.env.WP_URL}/wp-json/wp/v2/posts`;
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
    const params = {
      exclude: postId,
      per_page: 6,
      _fields: POST_CARD_FIELDS.join(","),
      _embed: "wp:featuredmedia",
    };
    if (_.isEmpty(ids)) {
      console.warn(`No tags for post ${postId}`);
    } else {
      params["tags"] = ids.join(",");
    }
    const postCards = await this.get("", params);

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

  async getLatestPostsWithSticky(number = 10) {
    // first get sticky posts (mise en avant)
    const postCards = await this.get("", {
      sticky: true,
      per_page: number,
      _fields: POST_CARD_FIELDS.join(","),
      _embed: "wp:featuredmedia",
    });
    // any left to fetch ?
    number -= postCards.length;
    if (number) {
      const remainingPostCards = await this.get("", {
        per_page: number,
        exclude: postCards.map(({ id }) => id),
        _fields: POST_CARD_FIELDS.join(","),
        _embed: "wp:featuredmedia",
      });
      postCards.push(...remainingPostCards);
    }

    return postCards.map(this.postCardReducer, this);
  }

  async getTopPostCards(number = 10) {
    const postCards = await this.get("", {
      tags: TOPS_TAG_ID,
      per_page: number,
      _fields: POST_CARD_FIELDS.join(","),
      _embed: "wp:featuredmedia",
    });

    return postCards.map(this.postCardReducer, this);
  }

  async searchPosts(text, page = 1, pageSize = 10) {
    const result = await this.getWithHeader("", {
      search: text,
      page,
      per_page: pageSize,
      _fields: POST_CARD_FIELDS.join(","),
      _embed: "wp:featuredmedia",
    });
    const { body: postCards, headers } = result;
    const total = parseInt(headers["x-wp-total"]);
    const totalPages = parseInt(headers["x-wp-totalpages"]);

    return {
      postCards: postCards.map(this.postCardReducer, this),
      hasMore: page < totalPages,
      total,
      totalPages,
    };
  }
}
