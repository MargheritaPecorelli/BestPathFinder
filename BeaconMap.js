// classe di Giacomo Mambelli

// import Graph from 'node-dijkstra';
const Graph = require('node-dijkstra');

// export default class BeaconMap {
class BeaconMap {
  /**
  * Constructs the Beacon map for a building
  *
  * @param beaconsList an array of beacon objects
  * @param edges an array of edge objects describing the beacon connections
  * @param accessible Wether only accessible edges should be considered, defaults to false
  * @param defaultEdgeLength The length to associate to any edge that doesn't specify it, defaults to 3
  */
  constructor(beaconsList, edges, accessible=false, defaultEdgeLength=3) {
    this.beacons = {};
    for (const beacon of beaconsList) {
      this.beacons[beacon.id] = beacon;
    }
    this.isAccessible = accessible;
    this.defaultEdgeLength = defaultEdgeLength;
    const beaconEdges = (this.isAccessible) ? edges.filter((edge) => {
      return edge.accessible == "true"
    }) : edges;
    this.initGraph(beaconEdges);
  }

  /**
  * Returns the path between two beacons in a building
  *
  * @param origin The beacon object or beacon ID to use as starting point
  * @param destination The beacon object or beacon ID to use as arrival point
  *
  * @return an object with the following properties:
    * beacons, an array of beacon objects composing the path
    * edges, an array of edge objects composing the path
    * length, the length of the path
  */
  getPath(origin, destination) {
      const pathOrigin = (typeof(origin) === 'string' || origin instanceof String) ? origin : origin.id;
      const pathDestination = (typeof(destination) === 'string' || destination instanceof String) ? destination : destination.id;
      const pathIDs = this.graph.path(pathOrigin, pathDestination, {"cost": true})
      if (pathIDs != null) {
          const startBeacon = this.beacons[pathIDs.path[0]];
          const path = {
              "beacons": [startBeacon],
              "edges": [],
              "length": pathIDs.cost
          };
          for (var i = 0; i < pathIDs.path.length - 1; i++) {
              const start = pathIDs.path[i];
              const endIndex = i+1;
              const end = pathIDs.path[endIndex];
              path.beacons[endIndex] = this.beacons[end];
              path.edges[i] = this.matrix[start][end];
          }
          return path;
      } else return null;
  }


  /// Initialization helpers, consider them as private methods
  /**
  * Initializes the internal graph
  * @param edges An array of Edge objects describing the graph connections
  */
  initGraph(edges) {
    this.initMatrix(edges);
    this.graph = new Graph();
    for (const start of Object.keys(this.matrix)) {
      const nodeEdges = {};
      for (const end of Object.keys(this.matrix[start])) {
        const edge = this.matrix[start][end];
        // consider only valid (start, end) pairs to prevent any eventual Object.keys() quirks
        if (start == edge.start && end == edge.end) {
          const edgeLength = (edge.length) ? edge.length : this.defaultEdgeLength;
          nodeEdges[edge.end] = edgeLength;
        }
      }
      this.graph.addNode(start, nodeEdges);
    }
  }

  /**
  * Initializes an internal matrix of Edge objects to manipulate data more efficiently. It can be seen as an adiacency matrix, but modified such that edge[i][j] is defined *only* if i and j are connected
  * @param edges An array of edge objects composing the graph
  */
  initMatrix(edges) {
    this.matrix = {};
        const groupedEdges = edges.groupBy('start');
        const startNodes = edges.map((edge) => {
          return edge.start
          });
            for (const startNode of startNodes) {
              this.matrix[startNode] = {};
      const nodeEdges = groupedEdges[startNode];
            for (const edge of nodeEdges) {
        this.matrix[startNode][edge.end] = edge;
      }
      }
    this.addOppositeEdges();
  }

  /**
  * Adds to the edge matrix the eventually missing opposite Edge objects
  */
  addOppositeEdges() {
    for (const start of Object.keys(this.matrix)) {
      for (const end of Object.keys(this.matrix[start])) {
                const edge = this.matrix[start][end];
        // consider only existing edges and valid (start, end) pairs
        if (typeof(edge) !== 'undefined' && start == edge.start && end == edge.end) {
          // add the opposite edge if necessary
          this.matrix[end] = this.matrix[end] || {};
          if (typeof(this.matrix[end][start]) === 'undefined') {
                      this.matrix[end][start] = this.invertEdge(edge);
          }
        }
      }
    }
  }

  /**
  * Returns the opposite edge of an edge
  * @param edge The Edge object of the edge to return the opposite of
  * @returns the Edge object describing the produced edge
  */
  invertEdge(edge) {
    const invertedEdge = {};
    // reverses the string, not built-in into javascript strings :()
    invertedEdge.id = edge.id.split('').reverse().join('');
    invertedEdge.accessible = edge.accessible;
    invertedEdge.degrees = (edge.degrees*1+180)%360;
    invertedEdge.image = edge.image;
    invertedEdge.start = edge.end;
    invertedEdge.end = edge.start;
    invertedEdge.type = edge.type;
    return invertedEdge;
  }

}

/**
  * groups the objects within an array by a given property
  * @return a dictionary where keys are the values of the property used to group the array by and values are arrays of objects where the property has the same value as the key
  */
Array.prototype.groupBy = function(prop) {
  return this.reduce(function(groups, item) {
    const val = item[prop];
    groups[val] = groups[val] || [];
    groups[val].push(item);
    return groups;
  }, {});
}

module.exports = BeaconMap;