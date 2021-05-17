import WordpresRESTDataSource from "../WordpresRESTDataSource";

export default class WordpressChouquetteAPI extends WordpresRESTDataSource {
  constructor() {
    super();
    this.baseURL = `${process.env.WP_URL}/wp-json/chouquette/v1`;
  }

  async getCriteriaForCategory(id) {
    const criteria = await this.get(`criteria/category/${id}`);

    return criteria.map(this.criteriaReducer, this);
  }

  async getCriteriaForFiche(id) {
    const criteriaCategories = await this.get(`criteria/fiche/${id}`);

    const result = [];
    for (const criteriaCategory of criteriaCategories) {
      result.push(
        ...criteriaCategory.flatMap(({ values }) =>
          values.map(this.criteriaTermReducer, this)
        )
      );
    }
    return result;
  }

  criteriaReducer(criteria) {
    return {
      id: criteria.id,
      name: criteria.name,
      taxonomy: criteria.taxonomy,
      values: criteria.values.map(this.criteriaTermReducer),
    };
  }

  criteriaTermReducer(criteriaTerm) {
    return {
      id: criteriaTerm.id,
      slug: criteriaTerm.slug,
      name: criteriaTerm.name,
      description: criteriaTerm.description,
    };
  }

  async postContact(name, email, subject, to, message, recaptcha) {
    try {
      const response = await this.post(`contact`, {
        name,
        email,
        subject,
        to,
        message,
        recaptcha,
      });
      return response;
    } catch (e) {
      this.throwApolloError(e);
    }
  }
}
