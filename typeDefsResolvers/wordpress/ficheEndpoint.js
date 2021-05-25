import he from "he";
import _ from "lodash";
import YoastAPI from "./yoastEndpoint";
import WordpressBaseAPI from "./baseEndpoint";
import WordpresRESTDataSource from "../WordpresRESTDataSource";
import { UserInputError } from "apollo-server-express";

export default class WordpressFicheAPI extends WordpresRESTDataSource {
  constructor() {
    super();
    this.baseURL = `${process.env.WP_URL}/wp-json/wp/v2/fiches`;
  }

  async getByIds(ids) {
    const fiches = await this.get(
      "",
      WordpressBaseAPI.queryParamBuilderForIds(ids, { _embed: true })
    );

    return fiches.map(this.ficheReducer, this);
  }

  async getBySlug(slug) {
    const result = await this.get("", { slug, _embed: true });

    if (_.isEmpty(result)) {
      return null;
    }
    const fiche = result[0];
    return this.ficheReducer(fiche);
  }

  async getByCategorySlug(
    slug,
    page = 1,
    pageSize = 10,
    location = null,
    search = null,
    criteria = null
  ) {
    const params = _.omitBy(
      {
        category: slug,
        location,
        search,
        page,
        per_page: pageSize,
        _embed: true,
      },
      _.isNil
    );
    const urlSearchParams = new URLSearchParams(params);
    if (criteria) {
      criteria.forEach(({ taxonomy, values }) => {
        urlSearchParams.append(`filter[${taxonomy}]`, values.join(","));
      });
    }

    const result = await this.getWithHeader("", urlSearchParams);
    const { body: fiches, headers } = result;
    const total = parseInt(headers["x-wp-total"]);
    const totalPages = parseInt(headers["x-wp-totalpages"]);

    return {
      fiches: fiches.map(this.ficheReducer, this),
      hasMore: page < totalPages,
      total,
      totalPages,
    };
  }

  async searchFiches(text, page = 1, pageSize = 10) {
    const result = await this.getWithHeader("", {
      search: text,
      page,
      per_page: pageSize,
      _embed: true,
    });
    const { body: fiches, headers } = result;
    const total = parseInt(headers["x-wp-total"]);
    const totalPages = parseInt(headers["x-wp-totalpages"]);

    return {
      fiches: fiches.map(this.ficheReducer, this),
      hasMore: page < totalPages,
      total,
      totalPages,
    };
  }

  async postContact(ficheId, name, email, message, recaptcha) {
    try {
      const response = await this.post(`${ficheId}/contact`, {
        name,
        email,
        message,
        recaptcha,
      });
      return response;
    } catch (e) {
      this.throwApolloError(e);
    }
  }

  async postReport(ficheId, name, email, message, recaptcha) {
    try {
      const response = await this.post(`${ficheId}/report`, {
        name,
        email,
        message,
        recaptcha,
      });
      return response;
    } catch (e) {
      this.throwApolloError(e);
    }
  }

  ficheReducer(fiche) {
    const result = {
      id: fiche.id,
      slug: fiche.slug,
      title: he.decode(fiche.title.rendered),
      date: new Date(fiche.date).toISOString(),
      content: he.decode(fiche.content.rendered),
      categoryIds: fiche.categories,
      locationId: fiche.locations ? fiche.locations[0] : null,
      linkedPostIds: fiche.linked_posts,

      info: this.infoReducer(fiche.info),
      isChouquettise: fiche.info.chouquettise,
      address: fiche.info.location?.address,

      principalCategoryId: fiche.main_category.id,
      logo: this.logoReducer(fiche.main_category),
      poi: fiche.info.location
        ? this.poiReducer(fiche.info.location, fiche.main_category.marker_icon)
        : null,

      // embedded
      criteria: fiche._embedded.criteria
        ? fiche._embedded.criteria[0]?.flat()
        : null,
      seo: YoastAPI.seoReducer(fiche),
    };

    // special treatment for featuredmedia
    const image = fiche._embedded["wp:featuredmedia"]
      ? fiche._embedded["wp:featuredmedia"][0]
      : null;
    if (!image) {
      console.error(
        `Fiche '${result.title}' (${result.id}) has not featured media`
      );
    } else if (image.code && image.code === "rest_forbidden") {
      // TODO send error to sentry
      console.error(
        `Fiche '${result.title}' (${result.id}) : cannot access featured media. Is it published ?`
      );
    } else {
      result.image = WordpressBaseAPI.mediaReducer(image);
    }

    return result;
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
}
