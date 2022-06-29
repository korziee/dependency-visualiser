import * as ts from "typescript";
import * as fs from "fs";
import config from "../parser-config";
import { Program } from "./types";

/**
 * Given a ts.Node and a ts.SyntaxKind this method will recursively dive into a node tree
 * until it finds a node by a given type.
 *
 * @note this will stop as soon as it finds the first node
 *
 * @param node
 * @param type
 * @returns
 */
export function diveUntilFindNodeType(
  node: ts.Node,
  type: ts.SyntaxKind
): ts.Node {
  let foundNode: ts.Node;

  function loop(innerNode: ts.Node) {
    if (innerNode.kind === type) {
      foundNode = innerNode;
      return;
    } else {
      ts.forEachChild(innerNode, loop);
    }
  }

  loop(node);

  return foundNode;
}

/** True if this is visible outside this file, false otherwise */
export function isNodeExported(node: ts.Node): boolean {
  return (
    (ts.getCombinedModifierFlags(node as ts.Declaration) &
      ts.ModifierFlags.Export) !==
      0 ||
    (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
  );
}

export function printNodeTree(node: ts.Node, depth = 0) {
  function logWithTab(contents: string, depth: number) {
    const spacer = new Array(depth).join("---");
    console.log(spacer, contents);
  }

  logWithTab(`kind(${node.kind} - ${ts.SyntaxKind[node.kind]})`, depth);
  logWithTab(`contents: ${node.getText()}`, depth);
  ts.forEachChild(node, (n) => printNodeTree(n, depth + 1));
}

export function findMethodDeclarationNodesForClassDeclaration(
  node: ts.ClassDeclaration
): ts.MethodDeclaration[] {
  let methodDeclarationNodes: ts.MethodDeclaration[] = [];

  ts.forEachChild(node, (n) => {
    if (n.kind === ts.SyntaxKind.MethodDeclaration) {
      methodDeclarationNodes.push(n as ts.MethodDeclaration);
    }
  });

  return methodDeclarationNodes;
}

export function findAllCallExpressionsInsideMethodDeclaration(
  node: ts.MethodDeclaration
): ts.CallExpression[] {
  let callExpressionNodes: ts.CallExpression[] = [];

  function loop(innerNode: ts.Node) {
    if (innerNode.kind === ts.SyntaxKind.CallExpression) {
      callExpressionNodes.push(innerNode as ts.CallExpression);
    }
    ts.forEachChild(innerNode, loop);
  }

  loop(node);

  return callExpressionNodes;
}

export function shouldIgnoreClass(name: string): boolean {
  if (config.ignoreClassesRegex.find((reg) => reg.test(name))) {
    return true;
  }

  return false;
}

export function shouldIgnoreDependency(type: string): boolean {
  return !!config.ignoreDependencyByTypeRegex.find((reg) => reg.test(type));
}

export function getSortedModuleDependenciesCountList(program: Program): any[] {
  let list = Object.entries(program).map(([key, { dependencies }]) => {
    return {
      name: key,
      dependencies: Object.keys(dependencies).length,
    };
  });

  list = list.sort((a, b) => {
    return b.dependencies - a.dependencies;
  });

  return list;
}

export function getSortedModuleDependentCountList(program: Program): any[] {
  let list = Object.entries(program).map(([key, { dependents }]) => {
    return {
      name: key,
      dependents: Object.keys(dependents).length,
    };
  });

  list = list.sort((a, b) => {
    return b.dependents - a.dependents;
  });

  return list;
}
