/*
 * Copyright (c) 2023 by Fabrice Douchant <fabrice.douchant@gmail.com>.
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { RESTDataSource } from "apollo-datasource-rest";

export default class MenuAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = `${process.env.WP_URL}/wp-json/menus/v1`;
  }

  async getMenus() {
    const menuList = await this.get(`menus`);

    const menus = [];
    await Promise.all(
      menuList.map((menu) => {
        return this.get(`menus/${menu.term_id}`).then((data) => {
          menus.push(this.menuReducer(data));
        });
      })
    );

    return menus;
  }

  menuReducer(menu) {
    const menuDTO = {
      id: menu.term_id,
      name: menu.name,
      slug: menu.slug,
    };

    menuDTO.items = menu.items.map(this.menuItemReducer);

    return menuDTO;
  }

  menuItemReducer(menuItem) {
    return {
      id: menuItem.object_id,
      type: menuItem.object,
      slug: menuItem.slug,
      title: menuItem.title,
      url: menuItem.url,
    };
  }
}
