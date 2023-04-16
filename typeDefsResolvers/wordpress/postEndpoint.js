/*
 * Copyright (c) 2023 by Fabrice Douchant <fabrice.douchant@gmail.com>.
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import he from "he";
import _ from "lodash";
import WordpressBaseAPI from "./baseEndpoint";
import YoastAPI from "./yoastEndpoint";
import WordpresRESTDataSource from "../WordpresRESTDataSource";

const POST_CARD_FIELDS = [
  "id",
  "slug",
  "title",
  "date",
  "modified",
  "author_meta.display_name",
  "tags",
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
    const result = await this.get("", { slug, _embed: 1 });

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
      isTop: post.tags.includes(TOPS_TAG_ID),

      ficheIds: post.meta.link_fiche,

      // embedded
      image: WordpressBaseAPI.mediaReducer(
        post._embedded["wp:featuredmedia"][0]
      ),
      authors: post.coauthors.map(this.coAuthorReducer),
      tags: WordpressBaseAPI.filterTags(post._embedded["wp:term"]),
      seo: YoastAPI.seoReducer(post),
    };
  }

  coAuthorReducer(coauthor) {
    return {
      id: coauthor.id,
      slug: coauthor.username,
      name: coauthor.name,
      description: he.decode(coauthor.description),
      avatar: coauthor.avatar,
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
      date: new Date(postCard.date).toISOString(),
      modified: new Date(postCard.modified).toISOString(),
      authorName: postCard.author_meta.display_name,
      title: he.decode(postCard.title.rendered),
      isTop: postCard.tags.includes(TOPS_TAG_ID),
      categoryId: postCard.top_categories[0],

      // embedded
      image: postCard._embedded
        ? WordpressBaseAPI.mediaReducer(postCard._embedded["wp:featuredmedia"][0])
        : null, // prettier-ignore
    };
  }

  async getLatestPosts(number = 10) {
    const postCards = await this.get("", {
      per_page: number,
      _fields: POST_CARD_FIELDS.join(","),
      _embed: "wp:featuredmedia",
      tags_exclude: TOPS_TAG_ID,
    });

    return postCards.map(this.postCardReducer, this);
  }

  async getTopPostCards(number = 10, stickyFirst = false) {
    let postCards = [];
    if (stickyFirst) {
      // first get sticky posts (mise en avant)
      postCards = await this.get("", {
        sticky: true,
        tags: TOPS_TAG_ID,
        per_page: number,
        _fields: POST_CARD_FIELDS.join(","),
        _embed: "wp:featuredmedia",
      });
    }
    // any left to fetch ?
    number -= postCards.length;
    if (number) {
      const remainingPostCards = await this.get("", {
        per_page: number,
        tags: TOPS_TAG_ID,
        exclude: postCards.map(({ id }) => id),
        _fields: POST_CARD_FIELDS.join(","),
        _embed: "wp:featuredmedia",
      });
      postCards.push(...remainingPostCards);
    }

    return postCards.map(this.postCardReducer, this);
  }

  async findPosts(
    category,
    search,
    asc = false,
    topOnly = false,
    page = 1,
    pageSize = 10
  ) {
    const params = _.omitBy(
      {
        category,
        search,
        order: asc ? "asc" : null,
        page,
        per_page: pageSize,
        _embed: 1,
      },
      _.isNil
    );
    if (topOnly) {
      params["tags"] = TOPS_TAG_ID;
    }

    const result = await this.getWithHeader("", {
      ...params,
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
