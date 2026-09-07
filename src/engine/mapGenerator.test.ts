import { describe, it, expect } from 'vitest';
import {
  generateInvestigationMap,
  generateProceduralInvestigationMap,
  BASE_MAP_TEMPLATE,
} from './mapGenerator';
import type { DepthLevel, InvestigationMap } from '../types/game';

describe('Investigation Map Generator (Issue #26 / ADR-0015)', () => {
  describe('16+16+16+8 Architecture', () => {
    it('always generates 16 nodes across 6 layers (2+3+3+4+3+1) for Depths 1, 2, and 3', () => {
      const depths: DepthLevel[] = [1, 2, 3];

      for (const depth of depths) {
        const map = generateInvestigationMap({ depth });
        expect(map.depth).toBe(depth);
        expect(map.layers).toHaveLength(6);
        expect(map.layers.map((l) => l.length)).toEqual([2, 3, 3, 4, 3, 1]);

        const nodeIds = Object.keys(map.nodes);
        expect(nodeIds).toHaveLength(16);

        // Every node registered in layers must exist in map.nodes
        for (const layer of map.layers) {
          for (const id of layer) {
            expect(map.nodes[id]).toBeDefined();
            expect(map.nodes[id].id).toBe(id);
          }
        }
      }
    });

    it('always generates 8 nodes across 4 layers (2+2+3+1) for Depth 4', () => {
      const map = generateInvestigationMap({ depth: 4 });
      expect(map.depth).toBe(4);
      expect(map.layers).toHaveLength(4);
      expect(map.layers.map((l) => l.length)).toEqual([2, 2, 3, 1]);

      const nodeIds = Object.keys(map.nodes);
      expect(nodeIds).toHaveLength(8);

      for (const layer of map.layers) {
        for (const id of layer) {
          expect(map.nodes[id]).toBeDefined();
        }
      }
    });

    it('confirms the 12-node legacy map template is completely abolished', () => {
      expect(BASE_MAP_TEMPLATE).toHaveLength(16);

      const defaultMap = generateInvestigationMap();
      expect(Object.keys(defaultMap.nodes)).toHaveLength(16);
      expect(defaultMap.layers).toHaveLength(6);

      const proceduralMap = generateProceduralInvestigationMap({ depth: 1 });
      expect(Object.keys(proceduralMap.nodes)).toHaveLength(16);
      expect(proceduralMap.layers).toHaveLength(6);
    });
  });

  describe('Zero Dead Ends & DAG Topology', () => {
    const testDepths: DepthLevel[] = [1, 2, 3, 4];

    function verifyDAGIntegrity(map: InvestigationMap) {
      const totalLayers = map.layers.length;

      // 1. Check all nodes before the final layer have valid outgoing edges to the next layer
      for (let l = 0; l < totalLayers - 1; l++) {
        for (const nodeId of map.layers[l]) {
          const node = map.nodes[nodeId];
          expect(node.nextNodes.length, `Node ${nodeId} at layer ${l} must have nextNodes`).toBeGreaterThan(0);

          for (const nextId of node.nextNodes) {
            const target = map.nodes[nextId];
            expect(target, `Target ${nextId} must exist`).toBeDefined();
            expect(target.layer, `Target ${nextId} must be in next layer ${l + 1}`).toBe(l + 1);
          }
        }
      }

      // 2. The boss node must be in the final layer with nextNodes: []
      const bossLayer = map.layers[totalLayers - 1];
      expect(bossLayer).toHaveLength(1);
      const bossNode = map.nodes[bossLayer[0]];
      expect(bossNode.type).toBe('boss');
      expect(bossNode.layer).toBe(totalLayers - 1);
      expect(bossNode.nextNodes).toEqual([]);

      // 3. Every node in layers >= 1 must have at least one incoming edge
      for (let l = 1; l < totalLayers; l++) {
        for (const nodeId of map.layers[l]) {
          const incoming = map.layers[l - 1].filter((prevId) =>
            map.nodes[prevId].nextNodes.includes(nodeId)
          );
          expect(
            incoming.length,
            `Node ${nodeId} at layer ${l} must have at least one incoming edge from layer ${l - 1}`
          ).toBeGreaterThan(0);
        }
      }

      // 4. Graph traversal: All nodes must be reachable from layer 0 entry nodes
      const visited = new Set<string>();
      const queue = [...map.layers[0]];
      for (const entryId of queue) {
        visited.add(entryId);
      }

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        const current = map.nodes[currentId];
        for (const nextId of current.nextNodes) {
          if (!visited.has(nextId)) {
            visited.add(nextId);
            queue.push(nextId);
          }
        }
      }

      expect(visited.size).toBe(Object.keys(map.nodes).length);
      expect(visited.has(bossNode.id)).toBe(true);
    }

    for (const depth of testDepths) {
      it(`verifies DAG integrity and reachability for Depth ${depth}`, () => {
        const map = generateInvestigationMap({ depth });
        verifyDAGIntegrity(map);
      });

      it(`verifies DAG integrity across randomized seeds for Depth ${depth}`, () => {
        const seeds = [42, 108, 999, 1337, 987654];
        for (const seed of seeds) {
          const map = generateInvestigationMap({ depth, seed, procedural: true });
          verifyDAGIntegrity(map);
        }
      });
    }
  });

  describe('Initial Node Accessibility', () => {
    it('initializes Layer 0 nodes as accessible and all subsequent nodes as unvisited', () => {
      const map = generateInvestigationMap({ depth: 1 });

      for (const id of map.layers[0]) {
        expect(map.nodes[id].status).toBe('accessible');
      }

      for (let l = 1; l < map.layers.length; l++) {
        for (const id of map.layers[l]) {
          expect(map.nodes[id].status).toBe('unvisited');
        }
      }
    });
  });

  describe('Node Types & Narrative Consistency', () => {
    it('contains all essential node types in Depth 1~3 maps', () => {
      const map = generateInvestigationMap({ depth: 1 });
      const types = new Set(Object.values(map.nodes).map((n) => n.type));

      expect(types.has('combat')).toBe(true);
      expect(types.has('elite')).toBe(true);
      expect(types.has('event')).toBe(true);
      expect(types.has('sanctuary')).toBe(true);
      expect(types.has('market')).toBe(true);
      expect(types.has('boss')).toBe(true);
    });

    it('ensures zero forbidden domain terms across all generated nodes for all depths', () => {
      const forbiddenRegex = /護盾|招架|格擋|狂暴|血量|體力|抽牌堆|固有|戰術牌|戰術卡/;

      for (let depth = 1; depth <= 4; depth++) {
        const map = generateInvestigationMap({ depth: depth as DepthLevel, seed: 777, procedural: true });
        for (const node of Object.values(map.nodes)) {
          expect(node.label).not.toMatch(forbiddenRegex);
          expect(node.title).not.toMatch(forbiddenRegex);
          expect(node.description).not.toMatch(forbiddenRegex);
        }
      }
    });
  });
});
