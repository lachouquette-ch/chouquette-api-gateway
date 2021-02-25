import { RESTDataSource } from "apollo-datasource-rest";
import he from "he";
import _ from "lodash";

const IMAGE_SIZES = ["medium", "medium_large", "large", "thumbnail"];

export default class WordpressBaseAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = "https://wordpress.lachouquette.ch/wp-json/wp/v2/";
  }

  async getByIds(resource, ids, queryParams = {}) {
    queryParams = {
      include: ids.join(","),
      per_page: ids.length,
      ...queryParams,
    };

    return this.get(resource, queryParams);
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

  locationReducer(location) {
    return {
      id: location.id,
      parentId: location.parent,
      name: location.name,
      slug: location.slug,
      description: location.slug,
    };
  }

  async getLocations() {
    const locations = await this.get(`locations`, {
      hide_empty: true,
      orderby: "count",
      order: "desc",
    });

    return locations.map(this.locationReducer);
  }

  async getLocationById(id) {
    const location = await this.get(`locations/${id}`);

    return this.locationReducer(location);
  }

  async getCategories() {
    const categories = await this.get(`categories`);

    return categories.map(this.categoryReducer);
  }

  async getCategoryByIds(ids) {
    const categories = await this.getByIds(`categories`, ids);

    return categories.map(this.categoryReducer);
  }

  async getMediaForCategories() {
    const categories = await this.getCategories();

    const categoryLogoIds = categories.flatMap(
      ({ logoYellowId, logoWhiteId, logoBlackId }) => [
        logoYellowId,
        logoWhiteId,
        logoBlackId,
      ]
    );
    return this.getMediaByIds(categoryLogoIds);
  }

  async getMediaById(id) {
    const media = await this.get(`media/${id}`);

    return this.mediaReducer(media);
  }

  mediaReducer(media) {
    const mediaDTO = {
      id: media.id,
      alt: he.decode(media.alt_text),
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

  categoryReducer(category) {
    return {
      id: category.id,
      name: he.decode(category.name),
      parentId: category.parent,
      logoYellowId: category.logos.logo_yellow,
      logoWhiteId: category.logos.logo_white,
      logoBlackId: category.logos.logo_black,
    };
  }
}
