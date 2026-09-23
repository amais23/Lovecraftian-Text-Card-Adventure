import { describe, it, expect } from 'vitest';
import type { DepthLevel } from '../types/game';
import {
  getMythosEventsForDepth,
  getMythosEvent,
  getMythosEventForNode,
  MYTHOS_EVENTS,
} from './eventData';

describe('Depth-Stratified Mythos Event Pool (ADR-0032 / Issue #52)', () => {
  const depths: DepthLevel[] = [1, 2, 3, 4];

  describe('Event Catalog Depth Stratification & Coverage', () => {
    it('provides at least 4 unique events per depth, totaling 16+ events across the game', () => {
      const allEventIds = new Set<string>();

      for (const depth of depths) {
        const events = getMythosEventsForDepth(depth);
        expect(
          events.length,
          `Depth ${depth} must contain at least 4 unique events, got ${events.length}`
        ).toBeGreaterThanOrEqual(4);

        for (const evt of events) {
          expect(evt.id).toBeDefined();
          expect(allEventIds.has(evt.id), `Duplicate event ID detected: ${evt.id}`).toBe(false);
          allEventIds.add(evt.id);
        }
      }

      expect(allEventIds.size).toBeGreaterThanOrEqual(16);
      expect(Object.keys(MYTHOS_EVENTS).length).toBeGreaterThanOrEqual(16);
    });

    it('ensures every event is fully specified with valid narrative, choices, and consequences', () => {
      const validConsequenceTypes = [
        'health_change',
        'sanity_change',
        'gain_obols',
        'gain_card',
        'gain_relic',
        'trigger_combat',
      ];

      for (const depth of depths) {
        const events = getMythosEventsForDepth(depth);
        for (const evt of events) {
          expect(evt.title.trim().length).toBeGreaterThan(0);
          expect(evt.location.trim().length).toBeGreaterThan(0);
          expect(evt.storyText.length).toBeGreaterThan(0);
          expect(evt.options.length).toBeGreaterThanOrEqual(2);

          for (const opt of evt.options) {
            expect(opt.id).toBeDefined();
            expect(opt.text.trim().length).toBeGreaterThan(0);
            expect(opt.consequences.length).toBeGreaterThan(0);

            for (const c of opt.consequences) {
              expect(validConsequenceTypes).toContain(c.type);
              expect(c.narrative.trim().length).toBeGreaterThan(0);
              if (c.type === 'gain_card') {
                expect(c.card).toBeDefined();
                expect(c.card?.name).toBeDefined();
              }
              if (c.type === 'gain_relic') {
                expect(c.relic).toBeDefined();
                expect(c.relic?.name).toBeDefined();
              }
              if (c.type === 'trigger_combat' && c.enemy) {
                expect(c.enemy.name).toBeDefined();
              }
            }
          }
        }
      }
    });

    it('strictly forbids forbidden domain terms across all mythos event texts', () => {
      const forbiddenRegex = /護盾|招架|格擋|狂暴|血量|體力|抽牌堆|固有|戰術牌|戰術卡/;

      for (const evt of Object.values(MYTHOS_EVENTS)) {
        expect(evt.title).not.toMatch(forbiddenRegex);
        expect(evt.location).not.toMatch(forbiddenRegex);
        for (const line of evt.storyText) {
          expect(line).not.toMatch(forbiddenRegex);
        }
        for (const opt of evt.options) {
          expect(opt.text).not.toMatch(forbiddenRegex);
          if (opt.costDescription) {
            expect(opt.costDescription).not.toMatch(forbiddenRegex);
          }
          for (const c of opt.consequences) {
            expect(c.narrative).not.toMatch(forbiddenRegex);
          }
        }
      }
    });
  });

  describe('No-Repeat Draw Pool within Single Expedition', () => {
    it('never repeats events in the same depth when visitedEventIds are tracked', () => {
      for (const depth of depths) {
        const poolSize = getMythosEventsForDepth(depth).length;
        const visited: string[] = [];

        for (let i = 0; i < poolSize; i++) {
          const evt = getMythosEvent(depth, visited);
          expect(visited.includes(evt.id), `Depth ${depth}: Event ${evt.id} was repeated`).toBe(false);
          visited.push(evt.id);
        }

        expect(visited).toHaveLength(poolSize);
      }
    });

    it('safely falls back without throwing when all events of a depth have been visited', () => {
      for (const depth of depths) {
        const events = getMythosEventsForDepth(depth);
        const allIds = events.map((e) => e.id);

        // When all events are already in visitedEventIds
        const fallbackEvent = getMythosEvent(depth, allIds);
        expect(fallbackEvent).toBeDefined();
        expect(fallbackEvent.id).toBeDefined();
        expect(allIds).toContain(fallbackEvent.id);
      }
    });

    it('getMythosEvent returns deep copies so mutations do not taint the master catalog', () => {
      const evt1 = getMythosEvent(1, []);
      evt1.title = 'MUTATED TITLE';
      evt1.options[0].text = 'MUTATED OPTION';

      const evt2 = getMythosEvent(1, []);
      expect(evt2.title).not.toBe('MUTATED TITLE');
      expect(evt2.options[0].text).not.toBe('MUTATED OPTION');
    });

    it('supports getMythosEventForNode backwards-compatibility with depth support', () => {
      const evt = getMythosEventForNode('node_3_2', 2, []);
      expect(evt).toBeDefined();
      expect(evt.id).toBeDefined();
    });
  });
});
