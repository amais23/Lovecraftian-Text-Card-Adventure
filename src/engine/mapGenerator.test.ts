import { describe, it, expect } from 'vitest';
import {
  generateInvestigationMap,
  generateProceduralInvestigationMap,
} from './mapGenerator';
import type { DepthLevel, InvestigationMap } from '../types/game';

describe('Investigation Map Generator (Issue #43 / ADR-0022)', () => {
  describe('16+16+16+8 Architecture', () => {
    it('always generates 16 layers (Layers 0~15) for Depths 1, 2, and 3', () => {
      const depths: DepthLevel[] = [1, 2, 3];

      for (const depth of depths) {
        const map = generateInvestigationMap({ depth });
        expect(map.depth).toBe(depth);
        expect(map.layers).toHaveLength(16);

        // Every layer must have between 1 and 5 nodes (boss layer has 1)
        for (let l = 0; l < 16; l++) {
          const layerNodes = map.layers[l];
          if (l === 15) {
            expect(layerNodes).toHaveLength(1);
            expect(map.nodes[layerNodes[0]].type).toBe('boss');
          } else {
            expect(layerNodes.length).toBeGreaterThanOrEqual(1);
            expect(layerNodes.length).toBeLessThanOrEqual(5);
          }
        }

        // Every node registered in layers must exist in map.nodes
        for (const layer of map.layers) {
          for (const id of layer) {
            expect(map.nodes[id]).toBeDefined();
            expect(map.nodes[id].id).toBe(id);
          }
        }
      }
    });

    it('always generates 8 layers (Layers 0~7) for Depth 4', () => {
      const map = generateInvestigationMap({ depth: 4 });
      expect(map.depth).toBe(4);
      expect(map.layers).toHaveLength(8);

      for (let l = 0; l < 8; l++) {
        const layerNodes = map.layers[l];
        if (l === 7) {
          expect(layerNodes).toHaveLength(1);
          expect(map.nodes[layerNodes[0]].type).toBe('boss');
        } else {
          expect(layerNodes.length).toBeGreaterThanOrEqual(1);
          expect(layerNodes.length).toBeLessThanOrEqual(5);
        }
      }

      for (const layer of map.layers) {
        for (const id of layer) {
          expect(map.nodes[id]).toBeDefined();
        }
      }
    });

    it('guarantees Layer 8 in Depths 1, 2, and 3 is a Mid-Depth Haven (all Sanctuary nodes)', () => {
      for (const depth of [1, 2, 3] as DepthLevel[]) {
        for (const seed of [42, 108, 999, 7777]) {
          const map = generateProceduralInvestigationMap({ depth, seed });
          const layer8NodeIds = map.layers[8];
          expect(layer8NodeIds.length).toBeGreaterThanOrEqual(1);
          expect(layer8NodeIds.length).toBeLessThanOrEqual(5);

          for (const nodeId of layer8NodeIds) {
            const node = map.nodes[nodeId];
            expect(node.type).toBe('sanctuary');
            expect(node.label).toBe('安全避難所');
          }
        }
      }
    });
  });

  describe('Zero Dead Ends & DAG Topology', () => {
    const testDepths: DepthLevel[] = [1, 2, 3, 4];

    function verifyDAGIntegrity(map: InvestigationMap) {
      const totalLayers = map.layers.length;

      // 1. Check all nodes before the final layer have valid outgoing edges (1~3 edges) to the next layer
      for (let l = 0; l < totalLayers - 1; l++) {
        for (const nodeId of map.layers[l]) {
          const node = map.nodes[nodeId];
          expect(node.nextNodes.length, `Node ${nodeId} at layer ${l} must have 1~3 nextNodes`).toBeGreaterThanOrEqual(1);
          expect(node.nextNodes.length, `Node ${nodeId} at layer ${l} must not exceed 3 nextNodes`).toBeLessThanOrEqual(3);

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
      const map = generateInvestigationMap({ depth: 1, seed: 12345 });
      const types = new Set(Object.values(map.nodes).map((n) => n.type));

      expect(types.has('combat')).toBe(true);
      expect(types.has('event')).toBe(true);
      expect(types.has('sanctuary')).toBe(true);
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

    it('generates altar, vault, or blood_altar across procedural maps', () => {
      const allFoundTypes = new Set<string>();

      // Sample maps across various seeds and depths
      for (const seed of [1, 2, 3, 5, 8, 13, 21, 34]) {
        for (const depth of [1, 2, 3] as DepthLevel[]) {
          const map = generateProceduralInvestigationMap({ depth, seed });
          for (const node of Object.values(map.nodes)) {
            allFoundTypes.add(node.type);
          }
        }
      }

      expect(allFoundTypes.has('altar')).toBe(true);
      expect(allFoundTypes.has('vault')).toBe(true);
      expect(allFoundTypes.has('blood_altar')).toBe(true);
    });

    it('conditionally generates remains node in Depth 1 when hasFallenInvestigator is true', () => {
      // 1. Procedural map with fallen investigator
      const proceduralWithRemains = generateProceduralInvestigationMap({
        depth: 1,
        seed: 42,
        hasFallenInvestigator: true,
      });
      const proceduralRemainsNodes = Object.values(proceduralWithRemains.nodes).filter(
        (n) => n.type === 'remains'
      );
      expect(proceduralRemainsNodes.length).toBeGreaterThan(0);
      expect(proceduralRemainsNodes[0].layer).toBe(1);
      expect(proceduralRemainsNodes[0].label).toBe('屍骨遺骸');

      // 2. Depth > 1 should not spawn remains even if hasFallenInvestigator is true
      const depth2Map = generateProceduralInvestigationMap({
        depth: 2,
        seed: 42,
        hasFallenInvestigator: true,
      });
      const depth2Remains = Object.values(depth2Map.nodes).filter((n) => n.type === 'remains');
      expect(depth2Remains).toHaveLength(0);

      // 3. Default generateInvestigationMap automatically detects localStorage
      localStorage.setItem(
        'arkham_fallen_investigator',
        JSON.stringify({
          name: '死者',
          deck: [],
          obols: 10,
        })
      );
      const autoMap = generateInvestigationMap({ depth: 1, seed: 42 });
      const remainsNodes = Object.values(autoMap.nodes).filter((n) => n.type === 'remains');
      expect(remainsNodes.length).toBeGreaterThan(0);
      localStorage.clear();
    });
  });

  describe('Guaranteed DAG Node Quotas (ADR-0032 / Issue #51)', () => {
    it('strictly guarantees 1~2 vaults, 1~2 markets, and 1~2 altars/blood_altars across 150 randomized maps in Depths 1, 2, 3', () => {
      const depths: DepthLevel[] = [1, 2, 3];
      const iterationsPerDepth = 50; // Total 150 iterations

      for (const depth of depths) {
        for (let i = 0; i < iterationsPerDepth; i++) {
          const seed = i * 10007 + depth * 31;
          const map = generateProceduralInvestigationMap({ depth, seed });

          let vaultCount = 0;
          let marketCount = 0;
          let altarTypeCount = 0;

          for (const node of Object.values(map.nodes)) {
            if (node.type === 'vault') vaultCount++;
            if (node.type === 'market') marketCount++;
            if (node.type === 'altar' || node.type === 'blood_altar') altarTypeCount++;
          }

          expect(
            vaultCount,
            `Depth ${depth}, seed ${seed}: vault count must be between 1 and 2, but got ${vaultCount}`
          ).toBeGreaterThanOrEqual(1);
          expect(
            vaultCount,
            `Depth ${depth}, seed ${seed}: vault count must not exceed 2, but got ${vaultCount}`
          ).toBeLessThanOrEqual(2);

          expect(
            marketCount,
            `Depth ${depth}, seed ${seed}: market count must be between 1 and 2, but got ${marketCount}`
          ).toBeGreaterThanOrEqual(1);
          expect(
            marketCount,
            `Depth ${depth}, seed ${seed}: market count must not exceed 2, but got ${marketCount}`
          ).toBeLessThanOrEqual(2);

          expect(
            altarTypeCount,
            `Depth ${depth}, seed ${seed}: altar/blood_altar count must be between 1 and 2, but got ${altarTypeCount}`
          ).toBeGreaterThanOrEqual(1);
          expect(
            altarTypeCount,
            `Depth ${depth}, seed ${seed}: altar/blood_altar count must not exceed 2, but got ${altarTypeCount}`
          ).toBeLessThanOrEqual(2);
        }
      }
    });

    it('ensures no layer has duplicate vaults or duplicate markets', () => {
      for (const depth of [1, 2, 3] as DepthLevel[]) {
        for (let i = 0; i < 30; i++) {
          const seed = i * 4001 + depth * 13;
          const map = generateProceduralInvestigationMap({ depth, seed });

          for (let l = 0; l < map.layers.length; l++) {
            const layerNodeIds = map.layers[l];
            const typesInLayer = layerNodeIds.map((id) => map.nodes[id].type);

            const vaultsInLayer = typesInLayer.filter((t) => t === 'vault').length;
            const marketsInLayer = typesInLayer.filter((t) => t === 'market').length;

            expect(
              vaultsInLayer,
              `Depth ${depth}, seed ${seed}, layer ${l}: cannot have more than 1 vault in the same layer`
            ).toBeLessThanOrEqual(1);
            expect(
              marketsInLayer,
              `Depth ${depth}, seed ${seed}, layer ${l}: cannot have more than 1 market in the same layer`
            ).toBeLessThanOrEqual(1);
          }
        }
      }
    });
  });
});

