import fs from 'node:fs';
import path from 'node:path';
import { runMapElitesOptimization } from '../src/engine/simulation/mapElitesOptimizer';

async function main() {
  console.log('================================================================');
  console.log('🧬 克蘇魯卡牌冒險 - MAP-Elites 品質多樣性流派極值探勘引擎');
  console.log('   (MAP-Elites Quality-Diversity Archetype Optimizer - ADR-0039)');
  console.log('================================================================\n');

  const args = process.argv.slice(2);
  let iterations = 3000;
  const iterIdx = args.indexOf('--iterations');
  if (iterIdx !== -1 && args[iterIdx + 1]) {
    iterations = parseInt(args[iterIdx + 1], 10);
  }

  console.log(`[配置] 目標演化代數: ${iterations} 代`);
  console.log(`[特徵網格] 維度 X: 攻防風格 (8 bins) × 維度 Y: 平均卡牌階級 (8 bins) = 64 格`);
  console.log(`[對標架構] 40% 基準深度 + 60% 跨階越級壓力測試 (Punch-Above-Weight)`);
  console.log(`[約束限制] 10 ~ 35 張理智牌庫，同名卡上限 3 張，手牌保留數 2 ~ 6 張\n`);

  const result = runMapElitesOptimization({
    iterations,
    xBins: 8,
    yBins: 8,
    onProgress: (p) => {
      const pct = Math.round((p.current / p.total) * 100);
      process.stdout.write(`\r[${pct}%] 演化代數: ${p.current}/${p.total} | 覆蓋生態格數: ${p.filledCells}/64...`);
    },
  });

  const durationSec = (result.durationMs / 1000).toFixed(2);
  const throughput = Math.round(iterations / parseFloat(durationSec));

  console.log(`\n\n✅ 演化收斂完成！總耗時: ${durationSec} 秒`);
  console.log(`⚡ 演化搜尋吞吐量: ${throughput} 代/秒 (含每代雙軌戰鬥模擬)`);
  console.log(`🌐 生態網格覆蓋率: ${result.filledCellsCount}/${result.totalCellsCount} 格 (${Math.round((result.filledCellsCount / result.totalCellsCount) * 100)}%)\n`);

  console.log('---------------- 探勘出的真正局部極值流派 (Peak Archetypes) ----------------\n');
  result.peakArchetypes.forEach((arch, idx) => {
    console.log(`🔥 【流派 ${idx + 1}】${arch.name}`);
    console.log(`   • 階級定位: Tier ${arch.avgTier.toFixed(2)} | 攻防風格: ${(arch.armorRatio * 100).toFixed(0)}% 護甲比`);
    console.log(`   • 綜合實力: ${arch.fitness.toFixed(1)} 分 | 牌庫規模: ${arch.deckSize} 張 | 手牌保留數: ${arch.handRetention} 張`);
    console.log(`   • 核心卡牌: ${arch.topCards.map((c) => `${c.name} (${c.count}x, T${c.tier})`).join('、')}`);
    console.log('');
  });

  // 匯出結果
  const outDir = path.resolve(process.cwd(), 'src/data/balance');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outFile = path.join(outDir, 'map_elites_archetypes.json');

  const exportCells = Array.from(result.archive.values()).map((c) => {
    // 統計卡表明細
    const cardCounts = new Map<string, { id: string; name: string; copies: number; category: any }>();
    for (const card of c.deck) {
      const baseId = card.id.replace(/_copy_\d+$/, '');
      const existing = cardCounts.get(baseId);
      if (existing) {
        existing.copies++;
      } else {
        cardCounts.set(baseId, {
          id: card.id,
          name: card.name,
          copies: 1,
          category: card.category,
        });
      }
    }

    const matchedPeak = result.peakArchetypes.find((p) => p.cellKey === `${c.xBin}_${c.yBin}`);
    const styleLabel = c.armorRatio > 0.65 ? '鐵壁防守' : c.armorRatio < 0.35 ? '直傷爆發' : '攻守均衡';
    const tierLabel = c.avgTier < 1.6 ? '前期低階' : c.avgTier < 2.5 ? '中期主力' : '後期神裝';

    return {
      id: `map_elite_${c.xBin}_${c.yBin}`,
      cellKey: `${c.xBin}_${c.yBin}`,
      name: matchedPeak ? matchedPeak.name : `【${tierLabel}·${styleLabel}】${c.deck[0]?.name || ''}`,
      xBin: c.xBin,
      yBin: c.yBin,
      armorRatio: c.armorRatio,
      avgTier: c.avgTier,
      fitness: c.fitness,
      handRetention: c.handRetention,
      deckSize: c.deck.length,
      baselineWin: c.baselineWin,
      stretchWin: c.stretchWin,
      baselineHpLost: c.baselineHpLost,
      stretchHpLost: c.stretchHpLost,
      isPeakArchetype: !!matchedPeak,
      peakArchetypeId: matchedPeak?.id,
      cards: Array.from(cardCounts.values()),
      totalCards: c.deck.length,
      winRate: c.stretchWin ? 0.95 : (c.baselineWin ? 0.75 : 0.4),
      avgHealthLost: Number((0.4 * c.baselineHpLost + 0.6 * c.stretchHpLost).toFixed(1)),
      avgSanityExpended: Math.round(c.deck.length * 0.35),
      overallScore: c.fitness,
      archetypeId: matchedPeak ? matchedPeak.id : `grid_${c.xBin}_${c.yBin}`,
      archetypeName: matchedPeak ? matchedPeak.name : `${tierLabel}·${styleLabel}`,
      drivingCombos: matchedPeak ? matchedPeak.topCards.slice(0, 2).map((tc) => ({ cards: [tc.name], synergy: 1.5 })) : [],
      x: c.armorRatio,
      y: Number(((c.avgTier - 1.0) / 2.5).toFixed(3)),
      cardNames: c.deck.map((card) => card.name),
    };
  });

  const exportData = {
    generatedAt: new Date().toISOString(),
    totalIterations: result.totalIterations,
    durationMs: result.durationMs,
    filledCellsCount: result.filledCellsCount,
    totalCellsCount: result.totalCellsCount,
    peakArchetypes: result.peakArchetypes,
    cells: exportCells,
  };

  fs.writeFileSync(outFile, JSON.stringify(exportData, null, 2), 'utf-8');
  console.log(`💾 已將完整網格與極值流派資料寫入: ${outFile}`);

  // 同步更新 balance_summary_data.json
  const summaryFile = path.join(outDir, 'balance_summary_data.json');
  if (fs.existsSync(summaryFile)) {
    try {
      const summaryData = JSON.parse(fs.readFileSync(summaryFile, 'utf-8'));
      summaryData.mapElitesData = {
        totalIterations: result.totalIterations,
        filledCellsCount: result.filledCellsCount,
        totalCellsCount: result.totalCellsCount,
        durationMs: result.durationMs,
        peakArchetypes: result.peakArchetypes,
        cells: exportCells,
      };

      // 將 6 大極值流派結構化為 EmergentArchetype 規格加入自然流派清單
      const convertedEmergentArchetypes = result.peakArchetypes.map((p) => {
        const cell = result.archive.get(p.cellKey);
        return {
          id: p.id,
          name: p.name,
          signatureCards: p.topCards.slice(0, 2).map((c) => ({ id: c.name, name: c.name })),
          memberCardIds: p.deck.map((c) => c.id),
          coreCombos: [
            {
              cardIds: p.topCards.slice(0, 2).map((c) => c.name),
              cardNames: p.topCards.slice(0, 2).map((c) => c.name),
              synergyScore: 2.0,
            },
          ],
          deckCount: 1,
          avgScore: p.fitness,
          avgHealthLost: Number((0.4 * (cell?.baselineHpLost ?? 0) + 0.6 * (cell?.stretchHpLost ?? 0)).toFixed(1)),
          avgSanityExpended: Math.round(p.deckSize * 0.35),
        };
      });

      // 優先置頂 MAP-Elites 極值流派
      summaryData.emergentArchetypes = [
        ...convertedEmergentArchetypes,
        ...(summaryData.emergentArchetypes || []).filter((a: any) => !a.id.startsWith('peak_archetype_')),
      ];

      fs.writeFileSync(summaryFile, JSON.stringify(summaryData, null, 2), 'utf-8');
      console.log(`💾 已同步將 MAP-Elites 局部極值流派更新至: ${summaryFile}\n`);
    } catch (e) {
      console.warn('同步寫入 balance_summary_data.json 警告:', e);
    }
  }

  // ADR-0039 門檻判定
  console.log('================ 算力裁決與 Issue #66 結論 (ADR-0039) ================');
  if (parseFloat(durationSec) <= 15.0) {
    console.log(`🟢 【裁決通過】純 TypeScript 引擎在 ${durationSec} 秒內完成 ${iterations} 代演化（門檻 <= 15 秒）。`);
    console.log('   證明：現行 TypeScript 算力已完全足以支撐全局局部極值流派探勘，無算力瓶頸。');
    console.log('   結論：Issue #66 (Rust/Wasm 統一重構) 當前不需要執行，可正式轉為遠期 Roadmap 儲備。');
  } else if (parseFloat(durationSec) <= 60.0) {
    console.log(`🟡 【中度負載】耗時 ${durationSec} 秒，TypeScript 可在背景完成，但若需十萬代大規模搜尋則建議未來重構。`);
  } else {
    console.log(`🔴 【觸發重構】耗時 ${durationSec} 秒（超過 60 秒門檻），證明需要啟動 Issue #66 Rust 算力突破。`);
  }
  console.log('======================================================================\n');
}

main().catch((err) => {
  console.error('執行失敗:', err);
  process.exit(1);
});
