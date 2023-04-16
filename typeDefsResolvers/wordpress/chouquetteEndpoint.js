/*
 * Copyright (c) 2023 by Fabrice Douchant <fabrice.douchant@gmail.com>.
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import WordpresRESTDataSource from "../WordpresRESTDataSource";

export default class WordpressChouquetteAPI extends WordpresRESTDataSource {
  constructor() {
    super();
    this.baseURL = `${process.env.WP_URL}/wp-json/chouquette/v1`;
  }

  async getTheme() {
    return await this.get(`theme`);
  }

  async getFiltersForCategory(id) {
    const categoryFilters = await this.get(`criteria/category/${id}`);

    return categoryFilters.map(this.categoryFilterReducer, this);
  }

  async getCategoryFiltersForFiche(id) {
    const filtersCategories = await this.get(`criteria/fiche/${id}`);

    const result = [];
    for (const filterCategory of filtersCategories) {
      result.push(
        ...filterCategory.flatMap(({ values }) =>
          values.map(this.categoryFilterTermReducer, this)
        )
      );
    }
    return result;
  }

  categoryFilterReducer(filter) {
    return {
      id: filter.id,
      name: filter.name,
      taxonomy: filter.taxonomy,
      values: filter.values.map(this.categoryFilterTermReducer),
    };
  }

  categoryFilterTermReducer(filterTerm) {
    return {
      id: filterTerm.id,
      slug: filterTerm.slug,
      name: filterTerm.name,
      description: filterTerm.description,
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
