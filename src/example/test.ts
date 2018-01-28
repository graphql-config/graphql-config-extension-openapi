import { patchEndpointsToConfigData, OpenApiEndpoint } from '../index'
import { printSchema } from 'graphql';

async function run() {
  const config = {
    projects: {
      petstore: {
        extensions: {
          openapi: {
            definition: './petstore.json',
          }
        },
      },
    },
  } as any

  const newConfig = await patchEndpointsToConfigData(config)
  console.log(JSON.stringify(newConfig, null, 2))

  const schema = await (newConfig.projects!.petstore.extensions!.endpoints!.default as OpenApiEndpoint).resolveSchema()
  console.log(printSchema(schema))
}

run().catch(e => console.error(e))
