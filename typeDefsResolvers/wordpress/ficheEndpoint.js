import { RESTDataSource } from "apollo-datasource-rest";
import he from "he";
import _ from "lodash";

export default class WordpressFicheAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = "https://wordpress.lachouquette.ch/wp-json/wp/v2/fiches";
  }

  async getBySlug(slug) {
    const result = await this.get("", { slug, _embed: true });

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
      categoryIds: fiche.categories,
      locationId: fiche.locations[0],
      linkedPostIds: fiche.linked_posts,

      info: this.infoReducer(fiche.info),
      isChouquettise: fiche.info.chouquettise,
      address: fiche.info.location.address,

      principalCategoryId: fiche.main_category.id,
      logo: this.logoReducer(fiche.main_category),
      poi: fiche.info.location
        ? this.poiReducer(fiche.info.location, fiche.main_category.marker_icon)
        : null,

      // embedded
      featuredMedia: fiche._embedded["wp:featuredmedia"][0],
      criteria: fiche._embedded.criteria,

      // seo
      seoMeta: fiche.yoast_meta,
      seoTitle: fiche.yoast_title,
      seoJsonLd: fiche.yoast_json_ld,
    };
  }

  infoReducer(info) {
    return {
      mail: info.mail,
      telephone: info.telephone,
      website: info.website,
      facebook: info.sn_facebook,
      instagram: info.sn_instagram,
      cost: info.cost,
      openings: info.openings,
    };
  }

  logoReducer(category) {
    return {
      slug: category.slug,
      name: category.name,
      url: category.logo,
    };
  }

  poiReducer(location, marker) {
    return {
      address: location.address,
      street: location.street_name,
      number: location.street_number,
      postCode: location.post_code,
      state: location.state,
      city: location.city,
      country: location.country,
      lat: location.lat,
      lng: location.lng,

      marker,
    };
  }

  ficheReducer(post) {
    return {
      id: post.id,
      title: he.decode(post.title.rendered),
      topCategory: post.top_categories[0],
    };
  }
}
