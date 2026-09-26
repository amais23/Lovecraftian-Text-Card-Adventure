import type { CostType } from '../types/game';

export interface CardProposalOverlay {
  proposed: {
    costType?: CostType;
    costValue?: number;
    keywords?: string[];
    description?: string;
  };
  designRationale: string;
  synergies: string[];
  counterplay?: string;
}

/**
 * 活躍的待審查改動草案 (Active Card Proposals)
 * 依據 ADR-0035，僅收錄「當前正在研議修改」之卡牌草案。
 * 一旦草案於 src/engine 實裝合併，只需將該項目自本映射表中移除，該卡即自動回歸最新 Live Baseline，杜絕陳舊 diff。
 */
export const ACTIVE_CARD_PROPOSALS: Record<string, CardProposalOverlay> = {
  // ==========================================
  // 一、白色真相體系重塑（拯救 D-Tier 陷阱牌）
  // ==========================================
  compendium_truth_glimmer: {
    proposed: {
      costType: 'stamina',
      costValue: 0,
      keywords: ['exhaust'],
      description: '【消耗】獲得 3 點護甲，抽取 1 張卡牌。打出後移出戰鬥。',
    },
    designRationale:
      '徹底解決真相流「抽牌稀釋（Draw Dilution）」的致死痛點。從 2 護甲廢牌升級為 3 護甲加抽牌（Cantrip），抽到時不虧手牌，兼顧心智屏障與手牌運轉。',
    synergies: ['truth_restore', 'armor_counter'],
    counterplay: '依賴注入源才能進入牌庫，單卡獨立價值有限。',
  },
  event_card_deep_truth: {
    proposed: {
      costType: 'stamina',
      costValue: 1,
      description: '獲得 5 點護甲，向理智牌庫注入 3 張真相卡牌。',
    },
    designRationale:
      '移除致死級自殘 2 HP，補償 5 點護甲，徹底擺脫 Score 24 / 均失血 13.1 的地獄級陷阱牌地位，成為安全展開真相體系的起手基石。',
    synergies: ['truth_restore', 'armor_counter'],
    counterplay: '注入的真相牌需後續回合抽到才能發揮護甲作用。',
  },
  reward_astral_insight_1: {
    proposed: {
      costType: 'stamina',
      costValue: 1,
      description: '抽取 1 張卡牌，向理智牌庫注入 3 張真相卡牌。',
    },
    designRationale:
      '移除自殘 2 HP，轉化為「抽 1 牌並注卡」，為秘術學者提供不虧手牌的心智構築手段。',
    synergies: ['truth_restore', 'high_cost_magic'],
    counterplay: '無直接護甲，需搭配其他防禦牌使用。',
  },
  card_event_breakwater: {
    proposed: {
      costType: 'stamina',
      costValue: 1,
      description: '獲得 8 點護甲，向理智牌庫注入 2 張真相卡牌。',
    },
    designRationale:
      '移除自殘 1 HP，賦予扎實的 8 點護甲，名副其實地發揮「防波堤」抵禦攻擊與平復心智的定位。',
    synergies: ['truth_restore', 'armor_counter'],
    counterplay: '注入數量微調為 2 張以平衡 8 點護甲的高防禦價值。',
  },
  card_event_elder_geometry: {
    proposed: {
      costType: 'stamina',
      costValue: 1,
      description: '獲得 6 點護甲，向理智牌庫注入 4 張真相卡牌。',
    },
    designRationale:
      '移除自殘 1 HP，注入 4 張微光的同時給予 6 點護甲，使 T2 階段的真相構築具備充足的容錯率。',
    synergies: ['truth_restore', 'armor_counter'],
    counterplay: '若理智牌庫過厚，可能推遲抽到高階終結卡牌的時機。',
  },
  card_meditate_1: {
    proposed: {
      costType: 'stamina',
      costValue: 1,
      description: '獲得 4 點護甲，洗回 2 張卡牌至理智牌庫。',
    },
    designRationale:
      '原效果為純洗牌（Score 24），在無防禦狀態下空過 1 費等同挨打。補充 4 點基礎護甲後，成為合乎基本模組的穩定洗牌防禦技。',
    synergies: ['truth_restore', 'armor_counter'],
    counterplay: '護甲值適中，面對高額爆發怪仍需疊加其他防具。',
  },
  card_silver_key_1: {
    proposed: {
      costType: 'stamina',
      costValue: 1,
      description: '獲得 4 點護甲，向理智牌庫注入 2 張真相卡牌。',
    },
    designRationale:
      '改善秘術學者起始手感，不再開局自損生命，提供穩妥的第一回合防禦與心智延展。',
    synergies: ['truth_restore', 'armor_counter'],
    counterplay: '屬於基礎過渡牌，後期需替換為更高階的星辰秘卷。',
  },
  card_truth_fragment_1: {
    proposed: {
      costType: 'stamina',
      costValue: 1,
      description: '造成 6 點秘術傷害，向理智牌庫注入 2 張真相卡牌。',
    },
    designRationale:
      '移除自殘 2 HP，賦予 6 點秘術傷害，使秘術學者開局牌組具備「邊輸出邊充填心智」的流暢體驗。',
    synergies: ['truth_restore', 'high_cost_magic'],
    counterplay: '傷害屬於入門水平，面對厚重裝甲怪效果有限。',
  },
  card_tier4_astral_revelation: {
    proposed: {
      costType: 'stamina',
      costValue: 1,
      description:
        '獲得 14 點護甲，向理智牌庫注入 6 張真相卡牌；本回合每打出 1 張真相卡，對全體敵人造成 8 點群星傷害。',
    },
    designRationale:
      '為整套真相流派提供決定性的 T4 終結手段（Finisher）。搭配升級後的真相微光（0費抽1），可實現行雲流水的心智連動爆發，徹底扭轉高理智流無法終結戰鬥的缺陷。',
    synergies: ['truth_restore', 'armor_counter'],
    counterplay: '需要前置回合已經向牌庫注入足夠真相微光，並在關鍵回合一口氣爆發打出。',
  },

  // ==========================================
  // 二、虛空高傷秘術平抑（打擊無腦秒殺）
  // ==========================================
  card_tier4_void_annihilation: {
    proposed: {
      costType: 'sanity',
      costValue: 2,
      description:
        '消耗 2 點理智與 1 點精力，造成 30 點秘術傷害；若目標處於【易傷】或【虛弱】，額外追加 10 點傷害。',
    },
    designRationale:
      '平抑單卡無腦瞬秒機制（42 -> 30+10）。在保留終局核彈定位的同時，要求先手鋪墊狀態，並增加 1 點耐力成本，避免連續空手超維斬殺。',
    synergies: ['status_attrition', 'bleed_pierce', 'high_cost_magic'],
    counterplay: '怪物若具有淨化或免疫狀態，將難以觸發 10 點額外追加傷害。',
  },
  card_tier3_void_collapse: {
    proposed: {
      costType: 'sanity',
      costValue: 2,
      description: '造成 24 點秘術傷害，並使目標陷入 2 層【易傷】狀態。',
    },
    designRationale:
      '降低 T3 秘術單發爆發力（34 -> 24），並附帶易傷效果，將其從純終結技轉型為「秘術重擊 + 物理/後續秘術增傷橋樑」。',
    synergies: ['high_cost_magic', 'status_attrition', 'bleed_pierce'],
    counterplay: '高護甲敵人可吸收部分傷害，需在易傷期間跟進後續輸出。',
  },
  reward_void_fire_1: {
    proposed: {
      costType: 'sanity',
      costValue: 2,
      description: '造成 14 點秘術傷害，並施加 2 層【流血】。',
    },
    designRationale:
      'T1 即能打出 18 傷在前期過於迅速，將 4 點即時傷害轉化為 2 層流血，促成秘術與流血體系的交叉聯動。',
    synergies: ['bleed_pierce', 'high_cost_magic'],
    counterplay: '流血需多回合結算，對速攻型怪物給予反擊空間。',
  },

  // ==========================================
  // 三、中立與物理技能平衡（修正過強與邊緣卡）
  // ==========================================
  reward_calm_observation: {
    proposed: {
      costType: 'stamina',
      costValue: 1,
      description:
        '獲得 4 點護甲，抽取 1 張卡牌；若當前護甲大於 0，額外抽取 1 張卡牌。',
    },
    designRationale:
      '原效果 1 費給 5 甲抽 2 牌嚴重超模（Score 77），碾壓職業專屬牌。改為基本 4 甲抽 1 牌，需已有護甲才觸發額外抽牌，獎勵穩健防守節奏。',
    synergies: ['armor_counter', 'status_attrition'],
    counterplay: '在無護甲狀態下打出僅能過 1 張牌，不再能單卡強行重啟節奏。',
  },
  card_tier3_demolition_pack: {
    proposed: {
      costType: 'stamina',
      costValue: 3,
      keywords: ['exhaust'],
      description:
        '【消耗】造成 30 點物理傷害，施加 3 層【流血】與 2 層【破勢】。打出後移出戰鬥。',
    },
    designRationale:
      '原單卡 40 傷加易傷使戰鬥瞬時結束。將直接傷害調整為 30 點，並將易傷替換為防守向的破勢（減傷），使其兼顧重創敵方與安全拆解危機的戰術定位。',
    synergies: ['bleed_pierce', 'armor_counter'],
    counterplay: '耗費 3 點耐力極大，若未終結敵人且無護甲防護，自身回合容易空檔。',
  },
  card_tier3_impenetrable_bastion: {
    proposed: {
      costType: 'stamina',
      costValue: 2,
      description: '獲得 16 點護甲與 1 層【堅韌】印記。',
    },
    designRationale:
      '將過高的純數值護甲（22）下調為 16 護甲 + 堅韌機制，增強應對高層多段攻擊與破甲怪物的戰術彈性，同時避免單卡數值膨脹。',
    synergies: ['armor_counter', 'status_attrition'],
    counterplay: '護甲仍會在回合結束時衰減，需合理規劃出牌時機。',
  },

  // ==========================================
  // 四、狂亂牌自殘優化（走鋼絲而非自殺）
  // ==========================================
  compendium_madness_blade: {
    proposed: {
      costType: 'stamina',
      costValue: 2,
      description:
        '造成 22 點物理傷害，使自身陷入 2 層【易傷】並侵蝕 2 張理智牌庫。',
    },
    designRationale:
      '移除致死級自殘 5 HP（Score 35 的元兇）。將代價改為受擊易傷與理智侵蝕，既貼合瘋狂失控的精神代價，又大幅提升在狂亂流派中的實戰可用性。',
    synergies: ['madness_sacrifice', 'bleed_pierce'],
    counterplay: '陷入 2 層易傷後若未能擊殺敵人，下回合將承受嚴重的物理增傷風險。',
  },
  compendium_madness_howl: {
    proposed: {
      costType: 'stamina',
      costValue: 1,
      description: '造成 14 點秘術傷害，自身失去 5 點護甲。',
    },
    designRationale:
      '將反噬從直接扣生命改為消耗當前護甲（護甲不足時不扣 HP），鼓勵在護甲充裕時作為破盾手段釋放狂暴傷害。',
    synergies: ['madness_sacrifice', 'high_cost_magic'],
    counterplay: '打出後自身防禦歸零或受挫，需防範敵方反擊。',
  },
};
