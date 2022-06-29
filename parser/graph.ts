import { Program } from "./types";

type GraphViz = string;

function startGraphViz(name: string): GraphViz {
  let str = `digraph ${name} {`;
  str += `\n\tgraph [pad="0.5", nodesep="1", ranksep="5"];`;
  str += `\n\tnode[shape = square, color=lightblue2, style=filled];`;
  str += `\n\tsplines="true";`;
  str += `\n\tsize="6,6";`;
  return str;
}

function finishGraphViz(graph: GraphViz, depth?: number): GraphViz {
  return `${graph}\n${new Array(depth).join("\t")}}`;
}

function addDependencyToGraph(
  graph: GraphViz,
  d1: string,
  d2: string
): GraphViz {
  return (graph += `\n\t"${d1}" -> "${d2}"`);
}

export function convertProgramToGraphViz(program: Program) {
  let graph = startGraphViz("dependencies");

  Object.entries(program).forEach(([programKey, { dependencies }]) => {
    Object.values(dependencies).forEach(({ type }) => {
      graph = addDependencyToGraph(graph, programKey, type);
    });
  });

  graph = finishGraphViz(graph);

  return graph;
}

/**
 * 
 * @param program digraph dependencies {
	size="6,6"
	node [color=lightblue2, style=filled];
	
	"Plant" -> "ground.plant()"
	"Plant" -> "water.plant()"
	

	subgraph cluster_ground {
	    label = "Ground"
	    "ground.plant()" [label = "plant"]
	}
	
	subgraph cluster_water {
	    label = "Water"
	    "water.plant()" [label = "plant"]
	}
}

 */

function startGraphCluster(name: string): GraphViz {
  let str = `subgraph cluster_${name.toLowerCase()} {`;
  str += `\n\t\tlabel = "${name}"`;

  return str;
}

function addGraphClusterMemberIfNotExists(
  cluster: GraphViz,
  memberName: string,
  memberLabel: string
): GraphViz {
  if (cluster.includes(memberName)) {
    return cluster;
  }

  return cluster + `\n\t\t"${memberName}" [label = "${memberLabel}"]`;
}

/**
 * @note this won't work until I parse the AST to generate a list of ALL methods on a class
 * its because graphviz doesn't cleanly allow you to connect something to a cluster entity
 * only a member of the cluster. i.e:
 *
 *     cluster -> cluster.member ❌
 *     cluster -> cluster ❌
 *     cluster.member -> cluster.member ✅
 *
 * Once I have a list of all methods on a class I could potentially out
 * the grapher to do the connections
 */
export function convertProgramToGraphVizWithModuleCalls(program: Program) {
  let graph = startGraphViz("dependencies_granular");

  const clusters: {
    [key: string]: GraphViz;
  } = {};

  // add module -> module.method dependencies
  // Object.entries(program).forEach(([programKey, { dependencies }]) => {
  //   Object.values(dependencies).forEach(({ methods, type }) => {
  //     Object.keys(methods).forEach((method) => {
  //       graph = addDependencyToGraph(graph, programKey, `${type}.${method}`);
  //     });
  //   });
  // });

  // generate clusters;
  Object.values(program).forEach(({ dependencies }) => {
    Object.values(dependencies).forEach(({ type, methods }) => {
      clusters[type] = clusters.type || startGraphCluster(type);
      Object.keys(methods).forEach((method) => {
        clusters[type] = addGraphClusterMemberIfNotExists(
          clusters[type],
          `${type}.${method}`,
          method
        );
      });
    });
  });

  // add in dependencies to clusters
  Object.entries(program).forEach(([programKey, { dependencies }]) => {
    Object.values(dependencies).forEach(({ type, methods }) => {
      // subgraph cluster_ground {
      //   label = "Ground"
      //   "Ground.plantG" [label = "plantG"]

      //   "Ground.plantG" -> "Water.plant"
      // }
      Object.keys(methods).forEach((method) => {
        clusters[type] = addDependencyToGraph(
          clusters[type],
          `${programKey}.???insert method calling from here???`,
          `${type}.${method}`
        );
      });
    });
  });

  // close cluster graphs
  Object.values(clusters).forEach((cluster) => {
    const clusterGraph = finishGraphViz(cluster, 2);

    graph += `\n\t${clusterGraph}`;
  });

  graph = finishGraphViz(graph);

  return graph;
}
