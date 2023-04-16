/*
 * Copyright (c) 2023 by Fabrice Douchant <fabrice.douchant@gmail.com>.
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { RESTDataSource } from "apollo-datasource-rest";
import he from "he";
import _ from "lodash";
import YoastAPI from "./yoastEndpoint";

export default class WordpressPageAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = `${process.env.WP_URL}/wp-json/wp/v2/pages`;
  }

  async getBySlug(slug) {
    const result = await this.get("", { slug });

    if (_.isEmpty(result)) {
      return null;
    }
    const page = result[0];

    return this.pageReducer(page);
  }

  pageReducer(page) {
    return {
      id: page.id,
      slug: page.slug,
      title: he.decode(page.title.rendered),
      date: page.date,
      modified: page.modified,
      content: he.decode(page.content.rendered),

      // embedded
      seo: YoastAPI.seoReducer(page),
    };
  }
}
