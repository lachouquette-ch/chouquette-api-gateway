import { RESTDataSource } from "apollo-datasource-rest";
import he from "he";

const IMAGE_SIZES = ["medium", "medium_large", "large", "thumbnail", "full"];

export default class WordpressBaseAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = "https://wordpress.lachouquette.ch/wp-json/wp/v2/";
  }

  static queryParamBuilderForIds(ids, queryParams = {}) {
    return {
      include: ids.join(","),
      per_page: ids.length,
      ...queryParams,
    };
  }

  async getSettings() {
    const settings = await this.get(
      `https://wordpress.lachouquette.ch/wp-json/`
    );

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

  static locationReducer(location) {
    return {
      id: location.id,
      parentId: location.parent,
      name: location.name,
      slug: location.slug,
      description: location.description,
    };
  }

  static categoryReducer(category) {
    return {
      id: category.id,
      slug: category.slug,
      name: he.decode(category.name),
      description: he.decode(category.description),
      parentId: category.parent,
      logoYellowId: category.logos.logo_yellow,
      logoWhiteId: category.logos.logo_white,
      logoBlackId: category.logos.logo_black,
    };
  }

  async getCategories(dataSources) {
    const categories = await this.get(`categories`, { per_page: 100 });

    return categories.map(WordpressBaseAPI.categoryReducer);
  }

  async getMediaForCategories(categories) {
    const categoryLogoIds = categories.flatMap(
      ({ logoYellowId, logoWhiteId, logoBlackId }) => [
        logoYellowId,
        logoWhiteId,
        logoBlackId,
      ]
    );

    const media = await this.get(
      `media`,
      WordpressBaseAPI.queryParamBuilderForIds(categoryLogoIds)
    );

    return media.map(WordpressBaseAPI.mediaReducer);
  }

  async getMediaById(id) {
    const media = await this.get(`media/${id}`);

    return WordpressBaseAPI.mediaReducer(media);
  }

  static mediaReducer(media) {
    const mediaDTO = {
      id: media.id,
      alt: he.decode(media.alt_text),
      source: media.source_url,
      sizes: [],
    };

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
      slug: author.id,
      name: author.name,
      description: he.decode(author.description),
      avatar: this.avatarReducer(author.avatar_urls),
    };
  }

  static avatarReducer(avatar) {
    return {
      size24: avatar["24"],
      size48: avatar["48"],
      size96: avatar["96"],
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
      authorAvatar: WordpressBaseAPI.avatarReducer(comment.author_avatar_urls),
      date: new Date(comment.date).toISOString(),
      content: he.decode(comment.content.rendered),
    };
  }
}
