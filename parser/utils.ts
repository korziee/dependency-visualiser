import * as ts from "typescript";

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
