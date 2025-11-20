import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { hasuraConfig } from '../../config/hasura.config';

@Injectable()
export class HasuraClientService {
  private readonly logger = new Logger(HasuraClientService.name);
  private readonly client: AxiosInstance;

  constructor() {
    const baseURL = `${hasuraConfig.url}${hasuraConfig.graphqlEndpoint}`;
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(hasuraConfig.adminSecret && {
          'x-hasura-admin-secret': hasuraConfig.adminSecret,
        }),
      },
      timeout: 10000,
    });
  }

  /**
   * Execute a GraphQL query/mutation against Hasura
   */
  async execute<T = any>(
    query: string,
    variables?: Record<string, any>,
  ): Promise<T> {
    try {
      const response = await this.client.post<{
        data?: T;
        errors?: Array<{ message: string; extensions?: any }>;
      }>('', {
        query,
        variables,
      });

      if (response.data.errors) {
        const errorMessages = response.data.errors
          .map((e) => e.message)
          .join(', ');
        this.logger.error(`Hasura GraphQL errors: ${errorMessages}`);
        throw new Error(`Hasura query failed: ${errorMessages}`);
      }

      return response.data.data as T;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `Hasura request failed: ${error.message}`,
          error.stack,
        );
        throw new Error(`Hasura request failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Check if Hasura is accessible
   */
  async checkHealth(): Promise<boolean> {
    try {
      const query = `query { __typename }`;
      await this.execute(query);
      return true;
    } catch (error) {
      return false;
    }
  }
}

