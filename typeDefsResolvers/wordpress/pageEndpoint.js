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
