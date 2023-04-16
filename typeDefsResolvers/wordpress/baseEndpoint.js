/*
 * Copyright (c) 2023 by Fabrice Douchant <fabrice.douchant@gmail.com>.
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { RESTDataSource } from "apollo-datasource-rest";
import he from "he";
import _ from "lodash";
import WordpresRESTDataSource from "../WordpresRESTDataSource";

const IMAGE_SIZES = ["medium", "medium_large", "large", "thumbnail", "full"];

export default class WordpressBaseAPI extends WordpresRESTDataSource {
  constructor() {
    super();
    this.baseURL = `${process.env.WP_URL}/wp-json/wp/v2`;
  }

  static queryParamBuilderForIds(ids, queryParams = {}) {
    return {
      include: ids.join(","),
      per_page: ids.length,
      ...queryParams,
    };
  }

  async getSettings() {
    const settings = await this.get(`${process.env.WP_URL}/wp-json/`);

    return {
      name: settings.name,
      description: settings.description,
      url: settings.url,
    };
  }

  async getLocations() {
    const locations = await this.get(`locations`, {
      hide_empty: true,
      orderby: "count",
      order: "desc",
    });

    return locations.map(WordpressBaseAPI.locationReducer);
  }

  async getValues() {
    const values = await this.get(`values`, { _embed: "icon" });

    return values.map(WordpressBaseAPI.valueReducer, this);
  }

  static locationReducer(location) {
    return {
      id: location.id,
      parentId: location.parent,
      name: location.name,
      slug: location.slug,
      description: location.description,
    };
  }

  static valueReducer(value) {
    return {
      id: value.id,
      name: value.name,
      slug: value.slug,
      description: value.description,

      // embedded
      image: WordpressBaseAPI.mediaReducer(value._embedded["icon"][0]),
    };
  }

  static categoryReducer(category) {
    try {
      const result = {
        id: category.id,
        slug: category.slug,
        name: he.decode(category.name),
        description: he.decode(category.description),
        parentId: category.parent,
      };

      // only logo for top level categories
      // TODO remove secondary level categories logos
      if (category.parent === 0) {
        // embedded
        result["logoYellow"] = WordpressBaseAPI.mediaReducer(
          category._embedded["logo_yellow"][0]
        );
        result["logoWhite"] = WordpressBaseAPI.mediaReducer(
          category._embedded["logo_white"][0]
        );
        result["logoBlack"] = WordpressBaseAPI.mediaReducer(
          category._embedded["logo_black"][0]
        );
      }

      return result;
    } catch (e) {
      console.error(`Error with category ${category.slug} : ${e}`);
      throw e;
    }
  }

  async getCategories(dataSources) {
    const categories = await this.get(`categories`, {
      per_page: 100,
      _embed: 1,
    });

    return categories.map(WordpressBaseAPI.categoryReducer);
  }

  static mediaReducer(media) {
    const mediaDTO = {
      id: media.id,
      alt: media.alt_text ? he.decode(media.alt_text) : "",
      source: media.source_url,
      sizes: [],
    };

    if (!media.media_details || _.isEmpty(media.media_details.sizes)) {
      return null;
    }

    for (const [name, rawInfo] of Object.entries(media.media_details.sizes)) {
      if (IMAGE_SIZES.includes(name)) {
        mediaDTO.sizes.push({
          name,
          image: {
            width: rawInfo.width,
            height: rawInfo.height,
            url: rawInfo.source_url,
          },
        });
      }
    }

    return mediaDTO;
  }

  static authorReducer(author) {
    return {
      id: author.id,
      slug: author.slug,
      name: author.name,
      title: author.title,
      description: he.decode(author.description),
      avatar: author.avatar_urls[96],
    };
  }

  async getCommentsByPostId(postId) {
    const comments = await this.get(`comments`, {
      post: postId,
      per_page: 100,
    });

    return comments.map(this.commentReducer, this);
  }

  commentReducer(comment) {
    return {
      id: comment.id,
      parentId: comment.parent,
      authorId: comment.author ? comment.author : null,
      authorName: comment.author_name,
      authorAvatar: comment.author_avatar_urls[96],
      date: new Date(comment.date).toISOString(),
      content: he.decode(comment.content.rendered),
    };
  }

  async getTeam() {
    const authors = await this.get(`team`);

    return authors.map(WordpressBaseAPI.authorReducer, this);
  }

  static filterTags(embeddedTerms) {
    return embeddedTerms.flat().filter((term) => term.taxonomy === "post_tag");
  }

  async postComment(
    postId,
    parentId,
    authorName,
    authorEmail,
    content,
    recaptcha
  ) {
    try {
      const response = await this.post(`comments`, {
        post: postId,
        parent: parentId,
        author_name: authorName,
        author_email: authorEmail,
        content,
        recaptcha,
      });
      return response;
    } catch (e) {
      this.throwApolloError(e);
    }
  }
}
