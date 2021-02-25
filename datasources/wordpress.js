import { RESTDataSource } from "apollo-datasource-rest";
import he from "he";
import _ from "lodash";

const IMAGE_SIZES = ["medium", "medium_large", "large", "thumbnail"];

export default class WordpressAPI extends RESTDataSource {
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

  async getCriteriaForFiche(id) {
    const criteriaCategories = await this.get(
      `https://wordpress.lachouquette.ch/wp-json/chouquette/v1/criteria/fiche/${id}`
    );

    const result = [];
    for (const criteriaCategory of criteriaCategories) {
      result.push(
        ...criteriaCategory.flatMap(({ values }) =>
          values.map(this.criteriaReducer)
        )
      );
    }
    return result;
  }

  criteriaReducer(criteria) {
    return {
      id: criteria.id,
      slug: criteria.slug,
      name: criteria.name,
      description: criteria.description,
    };
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
      top_categories: postCard.top_categories,
    };
  }

  async getFicheBySlug(slug) {
    const result = await this.get(`fiches`, { slug });

    if (_.isEmpty(result)) {
      return null;
    }
    const fiche = result[0];

    return {
      id: fiche.id,
      slug,
      title: he.decode(fiche.title.rendered),
      date: new Date(fiche.date).toISOString(),
      content: he.decode(fiche.content.rendered),
      isChouquettise: fiche.info.chouquettise,
      address: fiche.info.location.address,
      poi: fiche.info.location ? this.poiReducer(fiche.info.location) : null,
      info: this.chouquettiseInfoReducer(fiche.info),

      featured_media: fiche.featured_media,
      linked_posts: fiche.linked_posts,
    };
  }

  chouquettiseInfoReducer(info) {
    return {
      mail: info.mail,
      telephone: info.telephone,
      website: info.website,
      facebook: info.sn_facebook,
      instagram: info.sn_instagram,
      cost: info.cost,
      openings: info.openings
        ? Object.entries(info.openings).map(this.openingReducer)
        : null,
    };
  }

  openingReducer([key, value]) {
    return {
      dayOfWeek: key,
      opening: value,
    };
  }

  poiReducer(location) {
    return {
      street: location.street_name,
      number: location.street_number,
      postCode: location.post_code,
      state: location.state,
      city: location.city,
      country: location.country,
      lat: location.lat,
      lng: location.lng,
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

  async getLocations() {
    const locations = await this.get(`locations`, {
      hide_empty: true,
      orderby: "count",
      order: "desc",
    });

    return locations.map(this.locationReducer);
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

  ficheReducer(post) {
    return {
      id: post.id,
      title: he.decode(post.title.rendered),
      topCategory: post.top_categories[0],
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
