import { RESTDataSource } from "apollo-datasource-rest";

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
      title: entity.yoast_title,
      metadata: JSON.stringify(entity.yoast_meta),
      jsonLD: JSON.stringify(entity.yoast_json_ld),
    };
  }
}
