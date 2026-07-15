# Railswitch

Railswitch is an easy to use but full featured Feature Flag manager and evaluator.

<!--toc:start-->
- [Railswitch](#railswitch)
  - [Features](#features)
  - [Development](#development)
    - [Front-End API client generation](#front-end-api-client-generation)
<!--toc:end-->

## Features

- Easy to use: The goal of the project is to be powerful enough to be used by engineering teams, but be straightforward enough so non-engineering people can manage it when needed.
- Local evaluation: Flag state is replicated locally, and executed on your devices.
- Gradual rollouts: Set up pre-determined percentage bumps in a flag, to slowly roll out features to users

## Development

### Front-End API client generation

The Frond-End API client is generated directly from the OpenAPI spec that the Backend project outputs.

To regenerate them, do the following:

 1. In the `elixir/railswitch_backend/` folder run `mix openapi.generate`
 2. Restart the Vite development server or re-build the Front-end app
