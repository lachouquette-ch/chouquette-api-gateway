/*
 * Copyright (c) 2023 by Fabrice Douchant <fabrice.douchant@gmail.com>.
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { RESTDataSource } from "apollo-datasource-rest";
import { Headers, Request, Response } from "apollo-server-env";
import { UserInputError, ApolloError } from "apollo-server-express";
import { AuthenticationError, ForbiddenError } from "apollo-server-errors";

export default class WordpresRESTDataSource extends RESTDataSource {
  throwApolloError(error) {
    if (error.extensions?.response?.body) {
      /* eslint-disable indent */
      switch (error.extensions?.response?.status) {
        case 400:
        case 404:
        case 412:
          throw new UserInputError(
            error.extensions?.response?.body?.message,
            error.extensions
          );
        default:
          throw new ApolloError(
            error.extensions?.response?.body?.message,
            null,
            error.extensions
          );
      }
      /* eslint-enable indent */
    } else {
      throw new ApolloError(error);
    }
  }

  // return response data and headers
  async getWithHeader(path, params = null, init = { cacheOptions: null }) {
    return this.fetchWithHeader(Object.assign({ path, params }, init));
  }

  // minor override of RESTDataSource.fetch method
  async fetchWithHeader(init) {
    if (!(init.params instanceof URLSearchParams)) {
      init.params = new URLSearchParams(init.params);
    }

    if (!(init.headers && init.headers instanceof Headers)) {
      init.headers = new Headers(init.headers || Object.create(null));
    }

    const options = init;

    if (this.willSendRequest) {
      await this.willSendRequest(options);
    }

    const url = await this.resolveURL(options);

    // Append params to existing params in the path
    for (const [name, value] of options.params) {
      url.searchParams.append(name, value);
    }

    // We accept arbitrary objects and arrays as body and serialize them as JSON
    if (
      options.body !== undefined &&
      options.body !== null &&
      (options.body.constructor === Object ||
        Array.isArray(options.body) ||
        (options.body.toJSON && typeof options.body.toJSON === "function"))
    ) {
      options.body = JSON.stringify(options.body);
      // If Content-Type header has not been previously set, set to application/json
      if (!options.headers.get("Content-Type")) {
        options.headers.set("Content-Type", "application/json");
      }
    }

    const request = new Request(String(url), options);

    const cacheKey = this.cacheKeyFor(request);

    const performRequest = async () => {
      return this.trace(`${options.method || "GET"} ${url}`, async () => {
        const cacheOptions = options.cacheOptions
          ? options.cacheOptions
          : this.cacheOptionsFor && this.cacheOptionsFor.bind(this);
        try {
          const response = await this.httpCache.fetch(request, {
            cacheKey,
            cacheOptions,
          });
          // RETURN BODY AND HEADERS
          const body = await this.didReceiveResponse(response, request);
          // CONVERT SYMBOL TO MAP
          const headers = {};
          for (const [key, value] of response.headers.entries()) {
            headers[key] = value;
          }
          return { body, headers };
        } catch (error) {
          this.didEncounterError(error, request);
        }
      });
    };

    if (request.method === "GET") {
      let promise = this.memoizedResults.get(cacheKey);
      if (promise) return promise;

      promise = await performRequest();
      // ONLY CACHE BODY
      this.memoizedResults.set(cacheKey, promise.body);
      return promise;
    } else {
      this.memoizedResults.delete(cacheKey);
      return performRequest();
    }
  }
}
