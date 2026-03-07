# Phase 78 – Advanced Graph Analytics

## Goal
Move from graph storage to graph intelligence.

## New capabilities
- cluster ranking
- centrality scoring
- bridge node detection
- repeated topology subgraph detection
- hot infrastructure ranking

## Core modules
src/graph/
  centralityEngine.js
  clusterRanker.js
  bridgeDetector.js
  subgraphMiner.js
  hotNodeScorer.js

## New artifacts
- graph_metrics.json
- ranked_clusters.json
- bridge_nodes.json
- subgraph_patterns.json
- hot_infrastructure.json

## UI panels
- GraphAnalyticsPanel
- ClusterRankingPanel
- BridgeNodesPanel
- HotInfrastructurePanel
