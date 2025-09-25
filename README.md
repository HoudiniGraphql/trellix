# houdini/trellix

This is a Houdini clone of the [Remix Trellix Example](https://github.com/remix-run/example-trellix) 
meant to show case some real-world usecases that are difficult to show in a traditional To Do Application:

- Full-stack solution with a streamlined server <-> client development flow
- Coordinating multiple, inter-dependent optimistic updates
- Overlapping conflicting updates

## Running Locally
1. Clone repo
2. Install dependencies with `pnpm i`
3. Run with `pnpm dev`

## What is Houdini?

At its core, Houdini is an application framework designed to help you build the best GraphQL application possible.
You can think of it like the NextJS for GraphQL apps. It does this by providing a filesystem-based router that understands
GraphQL as a first-class citizen. This means you get the mental of Relay (composable fragments, preloaded queries on navigation, powerful caching
primitives, etc) without any of the mental gymastics. For more information, here is a talk @AlecAivazis gave at 
GraphQL Conf 2023: https://www.youtube.com/watch?v=iRoOhdYuygY

### How is the API defined?

With Houdini you can build a tightly integrated server for those users who are looking for a streamlined experience when building a full stack 
application with GraphQL. If you look at the [src/api/+schema.ts](https://github.com/HoudiniGraphql/trellix/blob/main/src/api/%2Bschema.ts) file 
you'll see that you are only responsible for defining a executable schema and then you can immediately use it without having to worry about 
wiring up any kind of complicated codegen pipeline - Houdini hooks into Vite to take care of everything behind the scenes.
