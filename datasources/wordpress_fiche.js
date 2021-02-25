import { RESTDataSource } from "apollo-datasource-rest";
import he from "he";
import _ from "lodash";

export default class WordpressFicheAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = "https://wordpress.lachouquette.ch/wp-json/wp/v2/";
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
      info: this.infoReducer(fiche.info),
      locationId: fiche.locations[0],
      categoryId: fiche.main_category.id,

      featured_media: fiche.featured_media,
      linked_posts: fiche.linked_posts,
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

  ficheReducer(post) {
    return {
      id: post.id,
      title: he.decode(post.title.rendered),
      topCategory: post.top_categories[0],
    };
  }
}
