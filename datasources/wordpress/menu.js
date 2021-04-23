import { RESTDataSource } from "apollo-datasource-rest";

export default class MenuAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = "https://wordpress.lachouquette.ch/wp-json/menus/v1/";
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
      url: menuItem.url,
    };
  }
}
