import { RESTDataSource } from "apollo-datasource-rest";
import he from "he";
import _ from "lodash";

export default class WordpressPageAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = "https://wordpress.lachouquette.ch/wp-json/wp/v2/pages";
  }

  async getBySlug(slug) {
    const result = await this.get("", { slug });

    if (_.isEmpty(result)) {
      return null;
    }
    const page = result[0];

    return {
      id: page.id,
      slug,
      title: he.decode(page.title.rendered),
      date: page.date,
      modified: page.modified,
      content: he.decode(page.content.rendered),

      // seo
      seoMeta: page.yoast_meta,
      seoTitle: page.yoast_title,
      seoJsonLd: page.yoast_json_ld,
    };
  }
}
