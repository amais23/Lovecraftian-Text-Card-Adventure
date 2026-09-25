import fs from 'node:fs';
import path from 'node:path';
import { runStratifiedBalanceSampling } from '../src/engine/simulation/balanceSampler';

async function main() {
  console.log('=====================================================');
  console.log('⚔️  克蘇魯卡牌冒險 - 分層正交蒙地卡羅平衡模擬引擎');
  console.log('   (Stratified Orthogonal Monte Carlo Balance Engine)');
  console.log('=====================================================\n');

  // 解析指令列參數
  const args = process.argv.slice(2);
  let runsPerMatchup = 200; // 預設每配置 200 場（雙軌並發共約 150 萬場對弈）
  const runsArgIdx = args.indexOf('--runs');
  if (runsArgIdx !== -1 && args[runsArgIdx + 1]) {
    runsPerMatchup = parseInt(args[runsArgIdx + 1], 10);
  }

  // 預設開啟「血量無上限模式」（以損失的肉體生命值衡量強弱），可透過 --standard-health 切換回 25 點血量殞命模式
  const uncappedHealth = !args.includes('--standard-health');

  console.log(`[設定] 每項變因對抗敵怪模擬場次: ${runsPerMatchup} 場 (雙軌並發)`);
  console.log(`[模式] ${uncappedHealth ? '🔥 血量無上限模式 (以肉體生命損失評定強弱)' : '標準 25 點生命模式 (含殞命截斷)'}`);
  console.log(`[目標] 覆蓋 73 張卡牌 (1x/2x/3x)、6 種遺物 (0~3x) 與 26 隻敵怪\n`);

  const startTime = performance.now();

  const { summary, rawLogs } = runStratifiedBalanceSampling({
    runsPerMatchup,
    uncappedHealth,
    onProgress: (p) => {
      process.stdout.write(`\r[${p.percent}%] ${p.stage} (${p.current}/${p.total})...`);
    },
  });

  const durationSec = ((performance.now() - startTime) / 1000).toFixed(2);
  console.log(`\n\n✅ 模擬完成！耗時: ${durationSec} 秒`);
  console.log(`📊 累計總對弈場次: ${summary.totalCombatsSimulated.toLocaleString()} 場`);
  console.log(`⚡ 平均運算吞吐量: ${(summary.totalCombatsSimulated / parseFloat(durationSec)).toFixed(0)} 場/秒\n`);

  // 確保目標輸出目錄存在
  const outputDir = path.resolve(process.cwd(), 'src/data/balance');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const summaryPath = path.join(outputDir, 'balance_summary_data.json');
  const rawPath = path.join(outputDir, 'balance_raw_data.json');

  console.log(`💾 正在寫入結構化摘要數據: ${summaryPath}...`);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');

  console.log(`💾 正在寫入原始對弈日誌數據: ${rawPath}...`);
  fs.writeFileSync(rawPath, JSON.stringify(rawLogs, null, 2), 'utf-8');

  // 印出關鍵洞察
  console.log('\n---------------- 核心天梯排行榜 (Top S-Tier Cards) ----------------');
  const sortedCards = Object.values(summary.cards).sort((a, b) => b.overallScore - a.overallScore);
  sortedCards.slice(0, 5).forEach((c, idx) => {
    console.log(
      ` ${idx + 1}. [${c.tierRating}] ${c.name} - 綜合: ${c.overallScore}分 | 生存: ${c.healthScore} | 平均損血: ${c.avgHealthLost} 點生命 | 心智: ${c.sanityScore} | 最優流派: ${c.bestArchetype} (${c.synergyMultipliers[c.bestArchetype]}x)`
    );
  });

  console.log('\n---------------- 敵怪威脅度排行榜 (Top Dangerous Enemies) ----------------');
  const sortedEnemies = Object.values(summary.enemies).sort((a, b) => b.threatScore - a.threatScore);
  sortedEnemies.slice(0, 5).forEach((e) => {
    console.log(
      ` #${e.rank} [${e.role.toUpperCase()}] ${e.name} (Depth ${e.depth}) - 威脅度: ${e.threatScore}分 | 造成生命損失: ${e.avgInvestigatorHealthLost} 點生命 | 調查員勝率: ${(e.investigatorWinRate * 100).toFixed(1)}% | 弱點流派: ${e.vulnerableArchetype}`
    );
  });

  console.log('\n🎉 所有資料均已產出完畢，遊戲前端與卡牌改動審查室可即時靜態讀取！\n');
}

main().catch((err) => {
  console.error('模擬器執行失敗:', err);
  process.exit(1);
});
