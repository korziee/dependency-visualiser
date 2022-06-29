import * as ts from "typescript";
import * as fs from "fs";
import {
  isNodeExported,
  findMethodDeclarationNodesForClassDeclaration,
  findAllCallExpressionsInsideMethodDeclaration,
  shouldIgnoreClass,
  shouldIgnoreDependency,
  getSortedModuleDependentCountList,
  getSortedModuleDependenciesCountList,
} from "./utils";
import { ClassMap, Program } from "./types";
import { convertProgramToGraphViz } from "./graph";
import config from "../parser-config";

function addDependentsToProgramClasses(program: Program): Program {
  Object.entries(program).forEach(([programKey, { dependencies }]) => {
    Object.values(dependencies).forEach(({ type }) => {
      if (program[type]) {
        program[type].dependents[programKey] = programKey;
      }
    });
  });

  return program;
}

function generateClassMapForClass(
  node: ts.ClassDeclaration,
  checker: ts.TypeChecker
): ClassMap {
  const moduleCallMap: ClassMap = {
    dependencies: {},
    dependents: {},
  };

  const symbol = checker.getSymbolAtLocation(node.name);

  checker
    .getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!)
    .getConstructSignatures()
    .forEach((signature) => {
      signature.parameters.forEach((parameter) => {
        const type = checker.typeToString(
          checker.getTypeOfSymbolAtLocation(
            parameter,
            parameter.valueDeclaration!
          )
        );

        if (shouldIgnoreDependency(type)) {
          console.log("Ignoring dependency:", type);
          return;
        }

        if (
          config.shouldIgnoreNonCapitalisedTypes &&
          type[0].toLowerCase() === type[0]
        ) {
          console.log("Ignoring dependency:", parameter.name);
          return;
        }

        moduleCallMap.dependencies[parameter.name] = {
          type: checker.typeToString(
            checker.getTypeOfSymbolAtLocation(
              parameter,
              parameter.valueDeclaration!
            )
          ),
          methods: {},
        };
      });
    });

  return moduleCallMap;
}

function populateDependencyMapMethodCallsForClass(
  node: ts.ClassDeclaration,
  checker: ts.TypeChecker,
  classMap: ClassMap
): void {
  // find all method declaration nodes
  const methodDeclarations =
    findMethodDeclarationNodesForClassDeclaration(node);

  methodDeclarations.forEach((methodDeclaration) => {
    const expressions =
      findAllCallExpressionsInsideMethodDeclaration(methodDeclaration);

    expressions.forEach((callExpression) => {
      const content = callExpression.getText();

      if (!content.includes("this")) {
        return;
      }

      const [, dependency, methodName] = content.split("(")[0].split(".");

      // guards against methods calling internal methods i.e., this.doSomething()
      if (!methodName) {
        return;
      }

      // guard against calling modules with nested methods on the member
      // like private members that are not injected, i.e. private logger = new Logger(), and this.logger.log
      if (!classMap.dependencies[dependency]) {
        return;
      }

      classMap.dependencies[dependency].methods[methodName] = classMap
        .dependencies[dependency].methods[methodName] || {
        timesCalled: 0,
      };
      classMap.dependencies[dependency].methods[methodName].timesCalled += 1;
    });
  });

  return;
}

function generateCouplingMap(fileNames: string[], options: ts.CompilerOptions) {
  // Build a program using the set of root file names in fileNames
  let program = ts.createProgram(fileNames, options);

  // Get the checker, we will use it to find more about classes
  let checker = program.getTypeChecker();
  let state: Program = {};

  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile) {
      // Walk the tree to search for classes
      ts.forEachChild(sourceFile, (node) => {
        if (!isNodeExported(node)) {
          return;
        }

        // skips things like import lines, end of file tokens, etc.
        if (!ts.isClassDeclaration(node)) {
          return;
        }

        // This is a top level class, get its symbol
        const symbol = checker.getSymbolAtLocation(node.name);

        if (shouldIgnoreClass(symbol.name)) {
          console.log("Ignoring: ", symbol.name);
          return;
        }

        // uncomment this to print out the entire tree for this node
        // printNodeTree(node);

        // generates the class map with the dependencies set based on
        // constructor arguments
        state[symbol.name] = generateClassMapForClass(node, checker);

        // traverses the AST to populate the method call count for dependencies
        populateDependencyMapMethodCallsForClass(
          node,
          checker,
          state[symbol.name]
        );
      });
    }
  }

  state = addDependentsToProgramClasses(state);

  fs.writeFileSync("module-map.json", JSON.stringify(state, null, 2));
  fs.writeFileSync("module-graph.dot", convertProgramToGraphViz(state));
  fs.writeFileSync(
    "module-sorted-dependent-list.json",
    JSON.stringify(getSortedModuleDependentCountList(state), null, 2)
  );
  fs.writeFileSync(
    "module-sorted-dependencies-list.json",
    JSON.stringify(getSortedModuleDependenciesCountList(state), null, 2)
  );
}

generateCouplingMap(process.argv.slice(2), {
  target: ts.ScriptTarget.ES5,
  module: ts.ModuleKind.CommonJS,
});
