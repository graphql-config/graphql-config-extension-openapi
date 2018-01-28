import * as build from '@kbrandwijk/swagger-to-graphql'
import { GraphQLSchema } from 'graphql'
import { GraphQLConfig, GraphQLConfigData, GraphQLEndpoint, GraphQLProjectConfig } from 'graphql-config'
import { set, values } from 'lodash'

export class OpenApiEndpoint extends GraphQLEndpoint {
  definitionFile: string

  constructor(definitionFile: string) {
    super({url: ''});
    this.definitionFile = definitionFile
  }

  async resolveSchema(): Promise<GraphQLSchema> {
    return build(this.definitionFile)
  }
}

export async function patchEndpointsToConfig<
  T extends GraphQLConfig | GraphQLProjectConfig
>(config: T, cwd?: string, envVars?: { [key: string]: any }): Promise<T> {
  config.config = await patchEndpointsToConfigData(config.config)
  return config
}

export async function patchEndpointsToConfigData(
  config: GraphQLConfigData
): Promise<GraphQLConfigData> {
  // return early if no openapi extension found
  const allExtensions = [
    config.extensions,
    ...values(config.projects).map(p => p.extensions),
  ]
  if (!allExtensions.some(e => e && e.openapi)) {
    return config
  }

  const newConfig = { ...config }

  if (newConfig.extensions && newConfig.extensions.openapi) {
    set(
      newConfig,
      ['extensions', 'endpoints'],
      { default: new OpenApiEndpoint(newConfig.extensions.openapi.definition) }
    )
  }

  if (newConfig.projects) {
    await Promise.all(
      Object.keys(newConfig.projects).map(async projectName => {
        const project = newConfig.projects![projectName]
        if (project.extensions && project.extensions.openapi) {
          set(
            newConfig,
            ['projects', projectName, 'extensions', 'endpoints'],
            { default: new OpenApiEndpoint(project.extensions.openapi.definition) }
          )
        }
      }),
    )
  }

  return newConfig
}
