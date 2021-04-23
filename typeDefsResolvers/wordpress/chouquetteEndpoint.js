import { RESTDataSource } from "apollo-datasource-rest";
import he from "he";
import _ from "lodash";

export default class WordpressChouquetteAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = "https://wordpress.lachouquette.ch/wp-json/chouquette/v1/";
  }

  async getCriteriaForFiche(id) {
    const criteriaCategories = await this.get(`criteria/fiche/${id}`);

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
}
