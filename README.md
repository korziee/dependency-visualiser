# What

This project analyses and produces a dependency map for projects using dependency injection through class arguments, ala NestJS (should work with Inversify too).

# Why

As a lightweight method to visualising dependency relationships. Ideally it also helps measure coupling and cohesion, for another time... maybe? probs not.

# How

This project uses the TypeScript compiler API (docs [here](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)) to parse a given file. It navigates through the AST to build up a dependency map for all classes.

Once this is complete a map is generated which holds a list of dependencies for each class, and how many times the different methods on each of the dependencies is called.

This map is output at `module-map.json`.

The map is then used to generate a DOT file, this DOT file can be used to visualise the dependencies in a GraphViz visualisation tool.

# Getting Started

`yarn` to install dependencies

# Development

## Running

1. `yarn tsc --watch`
2. `node out/parser/parser.js $file-to-parse-here$`
   - i.e. `node out/parser/parser.js test-files/plant.ts`

## Debugging

- modify the launch.json to target the file you want to parse
- press F5 to launch the debugger

# Viewing visualisations

Open the generated `module-graph.dot` file in http://viz-js.com/

# Viewing module map

Open the generate `module-map.json` file
