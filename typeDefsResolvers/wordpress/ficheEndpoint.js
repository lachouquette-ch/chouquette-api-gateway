import he from "he";
import _ from "lodash";
import YoastAPI from "./yoastEndpoint";
import WordpressBaseAPI from "./baseEndpoint";
import WordpresRESTDataSource from "../WordpresRESTDataSource";

const FICHE_CARD_FIELDS = [
  "id",
  "slug",
  "title",
  "content.rendered",
  "info.chouquettise",
  "info.location",
  "values",
  "featured_media",
  "main_category.marker_icon",

  "main_category.id",
  "locations",

  "_links.wp:featuredmedia",
];

export default class WordpressFicheAPI extends WordpresRESTDataSource {
  constructor() {
    super();
    this.baseURL = `${process.env.WP_URL}/wp-json/wp/v2/fiches`;
  }

  async getCardsByIds(ids) {
    const ficheCards = await this.get(
      "",
      WordpressBaseAPI.queryParamBuilderForIds(ids, {
        _fields: FICHE_CARD_FIELDS.join(","),
        _embed: 1,
      })
    );

    return ficheCards.map(this.ficheCardReducer, this);
  }

  async getBySlug(slug) {
    const result = await this.get("", { slug, _embed: 1 });

    if (_.isEmpty(result)) {
      return null;
    }
    const fiche = result[0];
    return this.ficheReducer(fiche);
  }

  async getLatestChouquettises(number = 10) {
    const result = await this.get("", {
      chouquettise: "only",
      per_page: number,
      _embed: 1,
    });

    return result.map(this.ficheReducer, this);
  }

  async getCardsByFilters(
    category = null,
    location = null,
    search = null,
    chouquettiseOnly = false,
    categoryFilters = null,
    page = 1,
    pageSize = 10
  ) {
    const params = _.omitBy(
      {
        category,
        location,
        search,
        page,
        per_page: pageSize,
        _fields: FICHE_CARD_FIELDS.join(","),
        _embed: 1,
      },
      _.isNil
    );
    if (chouquettiseOnly) params["chouquettise"] = "only";
    const urlSearchParams = new URLSearchParams(params);
    if (categoryFilters) {
      categoryFilters.forEach(({ taxonomy, values }) => {
        urlSearchParams.append(`filter[${taxonomy}]`, values.join(","));
      });
    }

    const result = await this.getWithHeader("", urlSearchParams);
    const { body: fiches, headers } = result;
    const total = parseInt(headers["x-wp-total"]);
    const totalPages = parseInt(headers["x-wp-totalpages"]);

    return {
      fiches: fiches.map(this.ficheCardReducer, this),
      hasMore: page < totalPages,
      total,
      totalPages,
    };
  }

  async getCardsBySearchText(text, page = 1, pageSize = 10) {
    const result = await this.getWithHeader("", {
      search: text,
      page,
      per_page: pageSize,
      _fields: FICHE_CARD_FIELDS.join(","),
      _embed: 1,
    });
    const { body: fiches, headers } = result;
    const total = parseInt(headers["x-wp-total"]);
    const totalPages = parseInt(headers["x-wp-totalpages"]);

    return {
      fiches: fiches.map(this.ficheCardReducer, this),
      hasMore: page < totalPages,
      total,
      totalPages,
    };
  }

  async getCardsByTagIds(ids, ficheId = null) {
    const params = {
      exclude: ficheId,
      per_page: 6,
      _fields: FICHE_CARD_FIELDS.join(","),
      _embed: 1,
    };
    if (_.isEmpty(ids)) {
      console.warn(`No tags for fiche ${ficheId}`);
    } else {
      params["tags"] = ids.join(",");
    }
    const ficheCards = await this.get("", params);

    return ficheCards.map(this.ficheCardReducer, this);
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
      valueIds: fiche.values,
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
      categoryFilters: fiche._embedded.criteria
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

  ficheCardReducer(ficheCard) {
    return {
      id: ficheCard.id,
      slug: ficheCard.slug,
      title: he.decode(ficheCard.title.rendered),
      content: he.decode(ficheCard.content.rendered),
      isChouquettise: ficheCard.info.chouquettise,
      principalCategoryId: ficheCard.main_category.id,
      categoryId: ficheCard.principalCategoryId,
      locationId: ficheCard.locations ? ficheCard.locations[0] : null,
      valueIds: ficheCard.values,
      /* eslint-disable indent */
      poi: ficheCard.info.location
        ? this.poiReducer(
            ficheCard.info.location,
            ficheCard.main_category.marker_icon
          )
        : null,
      /* eslint-enable indent */

      // embedded
      image: WordpressBaseAPI.mediaReducer(
        ficheCard._embedded["wp:featuredmedia"][0]
      ),
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
}
