import { RESTDataSource } from "apollo-datasource-rest";
import he from "he";
import _ from "lodash";

export default class WordpressChouquetteAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = "https://wordpress.lachouquette.ch/wp-json/chouquette/v1/";
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
}
