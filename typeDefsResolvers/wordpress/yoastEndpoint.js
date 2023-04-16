/*
 * Copyright (c) 2023 by Fabrice Douchant <fabrice.douchant@gmail.com>.
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { RESTDataSource } from "apollo-datasource-rest";
import he from "he";

export default class YoastAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = `${process.env.WP_URL}/wp-json/wp-rest-yoast-meta/v1/`;
  }

  async getRedirects() {
    const redirects = await this.get(`redirects`);

    return redirects.map(this.redirectReducer);
  }

  async getHome() {
    const home = await this.get(`home`);

    return YoastAPI.seoReducer(home);
  }

  redirectReducer(redirect) {
    const [from, to, status] = redirect.split(" ");
    return {
      from: from.replace(/\/$/, ""),
      to: to.replace(/\/$/, ""),
      status: parseInt(status),
    };
  }

  static seoReducer(entity) {
    return {
      title: he.decode(entity.yoast_title),
      metadata: JSON.stringify(entity.yoast_meta),
      jsonLD: JSON.stringify(entity.yoast_json_ld),
    };
  }
}
