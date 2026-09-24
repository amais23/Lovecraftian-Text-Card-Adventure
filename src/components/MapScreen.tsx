import React, { useRef, useState, useCallback, useLayoutEffect, useEffect } from 'react';
import type { GameAction, GameState, InvestigationMap, MapNode, MapNodeType } from '../types/game';
import { AudioToggle } from './AudioToggle';
import { soundEngine } from '../engine/audioManager';
import {
  Compass,
  Heart,
  Coins,
  ShieldCheck,
  Swords,
  Skull,
  HelpCircle,
  Tent,
  ShoppingBag,
  Eye,
  CheckCircle2,
  Navigation,
  Flame,
  Key,
  Droplets,
  Ghost,
  Sparkles,
} from 'lucide-react';
import { ArkhamGazette } from './ArkhamGazette';

interface MapScreenProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const NODE_TYPE_CONFIG: Record<
  MapNodeType,
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  combat: {
    label: '常規遭遇',
    icon: <Swords size={20} color="#e63946" />,
    color: '#e63946',
    bg: 'rgba(230, 57, 70, 0.15)',
  },
  elite: {
    label: '舊日精英',
    icon: <Skull size={20} color="#ff4d5a" />,
    color: '#ff4d5a',
    bg: 'rgba(255, 77, 90, 0.22)',
  },
  event: {
    label: '秘識奇遇',
    icon: <HelpCircle size={20} color="#cfa866" />,
    color: '#cfa866',
    bg: 'rgba(207, 168, 102, 0.15)',
  },
  sanctuary: {
    label: '安全避難所',
    icon: <Tent size={20} color="#74c69d" />,
    color: '#74c69d',
    bg: 'rgba(116, 198, 157, 0.15)',
  },
  market: {
    label: '黑市商人',
    icon: <ShoppingBag size={20} color="#ffd700" />,
    color: '#ffd700',
    bg: 'rgba(255, 215, 0, 0.15)',
  },
  boss: {
    label: '舊日宿敵',
    icon: <Eye size={24} color="#c77dff" />,
    color: '#c77dff',
    bg: 'rgba(199, 125, 255, 0.25)',
  },
  altar: {
    label: '禁忌祭壇',
    icon: <Flame size={20} color="#ff4a6e" />,
    color: '#ff4a6e',
    bg: 'rgba(255, 74, 110, 0.18)',
  },
  vault: {
    label: '遺物秘閣',
    icon: <Key size={20} color="#e0a96d" />,
    color: '#e0a96d',
    bg: 'rgba(224, 169, 109, 0.18)',
  },
  blood_altar: {
    label: '血之祭壇',
    icon: <Droplets size={20} color="#d90429" />,
    color: '#d90429',
    bg: 'rgba(217, 4, 41, 0.18)',
  },
  remains: {
    label: '屍骨遺骸',
    icon: <Ghost size={20} color="#b8c0ff" />,
    color: '#b8c0ff',
    bg: 'rgba(184, 192, 255, 0.18)',
  },
};

const DEPTH_DISPLAY_INFO: Record<number, { title: string; subtitle: string }> = {
  1: {
    title: '第一深度：阿卡姆封鎖區 · 調查路線圖',
    subtitle: '選擇連通節點啟程探索，十六層長征直通修格斯幼體之巢穴',
  },
  2: {
    title: '第二深度：深潛者海蝕迷宮 · 調查路線圖',
    subtitle: '潮聲轟鳴於淹沒甬道，直面大袞深淵祭司的凝視',
  },
  3: {
    title: '第三深度：無底深淵祭壇 · 調查路線圖',
    subtitle: '踏入不可名狀原形禁域，挑戰原生巨型修格斯',
  },
  4: {
    title: '第四深度：星辰正位 · 拉萊耶核心 · 終局之圖',
    subtitle: '群星歸位之刻已至，迎戰克蘇魯星之眷族',
  },
};

/**
 * 計算地圖節點在 SVG 畫布中的相對像素座標（無 DOM 測量時的平滑降級）
 */
function getNodeCoordinates(
  node: MapNode,
  map: InvestigationMap,
  dimensions?: { width?: number; height?: number }
): { x: number; y: number } {
  const layerLength = map.layers[node.layer]?.length ?? 1;
  const totalLayers = map.layers.length;
  // 縱向翻轉：Layer 0 在底，Layer totalLayers-1 在頂
  const visualRow = totalLayers - 1 - node.layer;
  const canvasWidth = dimensions?.width && dimensions.width > 0 ? dimensions.width : 800;
  const canvasHeight =
    dimensions?.height && dimensions.height > 140
      ? dimensions.height
      : totalLayers * 140;
  const rowSpacing = (canvasHeight - 140) / Math.max(1, totalLayers - 1);

  return {
    x: Math.round((node.col + 1) * (canvasWidth / (layerLength + 1))),
    y: Math.round(visualRow * rowSpacing + 70),
  };
}

export const MapScreen: React.FC<MapScreenProps> = ({ state, dispatch }) => {
  const map = state.map;
  const investigator = state.investigator;
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // 滑鼠與觸控拖曳卷軸手勢狀態
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [scrollStartY, setScrollStartY] = useState(0);

  const updatePositions = useCallback(() => {
    if (!canvasRef.current || !map) return;
    const canvasEl = canvasRef.current;
    const canvasRect = canvasEl.getBoundingClientRect();
    if (canvasRect.width === 0) return;

    // 取得畫布實體完整高度與寬度，避免 WebKit / Safari 下 flex 子元素百分比高度截斷
    const fullHeight = Math.max(canvasEl.scrollHeight, canvasEl.offsetHeight, Math.round(canvasRect.height));
    const fullWidth = Math.max(canvasEl.scrollWidth, canvasEl.offsetWidth, Math.round(canvasRect.width));
    setCanvasDimensions((prev) => (prev.width === fullWidth && prev.height === fullHeight ? prev : { width: fullWidth, height: fullHeight }));

    const positions: Record<string, { x: number; y: number }> = {};
    for (const nodeId of Object.keys(map.nodes)) {
      const el = document.getElementById(`map-node-${nodeId}`);
      if (el) {
        const elRect = el.getBoundingClientRect();
        positions[nodeId] = {
          x: elRect.left - canvasRect.left + elRect.width / 2,
          y: elRect.top - canvasRect.top + elRect.height / 2,
        };
      }
    }
    setNodePositions(positions);
  }, [map]);

  useLayoutEffect(() => {
    updatePositions();
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && canvasRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updatePositions();
      });
      resizeObserver.observe(canvasRef.current);
    }
    window.addEventListener('resize', updatePositions);
    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', updatePositions);
    };
  }, [updatePositions]);

  const entryNodeId = map?.layers[0]?.[0];
  const currentNodeId = map?.currentNodeId;
  const depth = map?.depth;

  // 載入時平滑自動聚焦於當前所在層級（由底往上自動滾動至目標）
  useEffect(() => {
    const targetNodeId = currentNodeId ?? entryNodeId;
    if (!targetNodeId) return;

    const targetId = `map-node-${targetNodeId}`;
    const timer = setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [currentNodeId, entryNodeId, depth]);

  const permanentDeckCapacity = [
    ...state.sanityDeck,
    ...state.hand,
    ...state.discardPile,
  ].filter((c) => !c.isTemporary).length;

  const handleNodeClick = (node: MapNode) => {
    if (node.status === 'accessible') {
      soundEngine.playClick();
      dispatch({
        type: 'NAVIGATE_TO_NODE',
        payload: { nodeId: node.id },
      });
    }
  };

  // 支援滑鼠與觸控拖曳瀏覽縱向卷軸
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.map-node-card.accessible')) return;
    if (!viewportRef.current) return;
    setIsDragging(true);
    setDragStartY(e.clientY);
    setScrollStartY(viewportRef.current.scrollTop);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !viewportRef.current) return;
    const deltaY = e.clientY - dragStartY;
    viewportRef.current.scrollTop = scrollStartY - deltaY;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.map-node-card.accessible')) return;
    if (!viewportRef.current || e.touches.length === 0) return;
    setIsDragging(true);
    setDragStartY(e.touches[0].clientY);
    setScrollStartY(viewportRef.current.scrollTop);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !viewportRef.current || e.touches.length === 0) return;
    const deltaY = e.touches[0].clientY - dragStartY;
    viewportRef.current.scrollTop = scrollStartY - deltaY;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  if (!map) {
    return (
      <div className="map-screen-container">
        <p>地圖資料加載中……</p>
      </div>
    );
  }

  const currentDepth = state.currentDepth ?? map.depth ?? 1;
  const depthInfo = DEPTH_DISPLAY_INFO[currentDepth] ?? DEPTH_DISPLAY_INFO[1];
  const currentLayer = map.currentNodeId ? (map.nodes[map.currentNodeId]?.layer ?? 0) + 1 : 1;
  const totalLayers = map.layers.length;

  // 縱向羊皮紙卷軸由下往上：頂部為守關首領（Layer totalLayers-1），底部為起始入口（Layer 0）
  const reversedLayers = map.layers
    .map((nodeIds, originalIndex) => ({
      layerIndex: originalIndex,
      nodeIds,
    }))
    .reverse();

  return (
    <div className="map-screen-container">
      {/* Background Ambience Layers (ADR-0020) */}
      <div className="map-screen-bg-image" data-testid="map-screen-bg-image" />
      <div className="map-screen-bg-overlay" />
      <div className="vignette-overlay" />
      <div className="fog-layer" />

      {/* Top Investigator Status Bar */}
      <header className="map-header-bar">
        <div className="map-header-left">
          <div className="map-investigator-badge">
            <Compass size={22} color="#cfa866" />
            <div className="map-investigator-info">
              <span className="map-investigator-name">{investigator.name}</span>
              <span className="map-investigator-occ">{investigator.occupation}</span>
            </div>
          </div>
        </div>

        <div className="map-header-center">
          <h2 className="map-header-title">{depthInfo.title}</h2>
          <span className="map-header-subtitle">{depthInfo.subtitle}</span>
        </div>

        <div className="map-header-right">
          {/* Exploration Floor Progress */}
          <div
            className="map-status-pill progress"
            title={`調查探索進度：當前位於第 ${currentLayer} / ${totalLayers} 層級`}
          >
            <Navigation size={17} color="#64dfdf" />
            <span>進度 {currentLayer} / {totalLayers} 層</span>
          </div>

          {/* Health Status */}
          <div className="map-status-pill health" title="持久肉體生命值（戰後不自動復原）">
            <Heart size={18} color="#ff334b" />
            <span>
              {investigator.health} / {investigator.maxHealth}
            </span>
          </div>

          {/* Sanity Deck Capacity */}
          <div className="map-status-pill sanity" title="一般卡總數（每場戰鬥理智上限）">
            <ShieldCheck size={18} color="#c77dff" />
            <span>{permanentDeckCapacity} 理智</span>
          </div>

          {/* Ancient Obols */}
          <div className="map-status-pill obols" title="古金幣（可用於黑市採購）">
            <Coins size={18} color="#ffd700" />
            <span>{investigator.obols} 枚</span>
          </div>

          <AudioToggle />
        </div>
      </header>

      {/* Main Map Vertical Parchment Scroll Viewport */}
      <main
        ref={viewportRef}
        className={`map-viewport vertical-parchment-scroll ${isDragging ? 'is-dragging' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div ref={canvasRef} className="map-canvas parchment-canvas">
          {/* SVG Connecting Bezier Ink Curves between reachable nodes */}
          <svg
            className="map-connections-svg"
            style={{
              width: canvasDimensions.width > 0 ? `${canvasDimensions.width}px` : '100%',
              height:
                canvasDimensions.height > 0
                  ? `${canvasDimensions.height}px`
                  : `${map.layers.length * 140}px`,
            }}
          >
            <defs>
              <linearGradient id="activeInkGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#d4af37" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#ffd700" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#ffe680" stopOpacity="1" />
              </linearGradient>
            </defs>

            {map.layers.map((layerNodeIds) =>
              layerNodeIds.map((nodeId) => {
                const node = map.nodes[nodeId];
                if (!node || !node.nextNodes.length) return null;

                return node.nextNodes.map((targetId) => {
                  const target = map.nodes[targetId];
                  if (!target) return null;

                  const isPathAvailable =
                    (node.status === 'current' && target.status === 'accessible') ||
                    (node.status === 'visited' && (target.status === 'visited' || target.status === 'current'));

                  const sourcePos = nodePositions[node.id];
                  const targetPos = nodePositions[target.id];

                  const sourceCoord = sourcePos ?? getNodeCoordinates(node, map, canvasDimensions);
                  const targetCoord = targetPos ?? getNodeCoordinates(target, map, canvasDimensions);

                  // 墨水三次貝茲曲線 (Cubic Bezier S-Curve)
                  const deltaY = targetCoord.y - sourceCoord.y;
                  const curveD = `M ${sourceCoord.x} ${sourceCoord.y} C ${sourceCoord.x} ${
                    sourceCoord.y + deltaY * 0.5
                  }, ${targetCoord.x} ${sourceCoord.y + deltaY * 0.5}, ${targetCoord.x} ${targetCoord.y}`;

                    return (
                      <path
                        key={`${node.id}->${target.id}`}
                        d={curveD}
                        className={
                          isPathAvailable
                            ? 'map-ink-path map-ink-path-active'
                            : node.status === 'visited'
                            ? 'map-ink-path map-ink-path-visited'
                            : 'map-ink-path'
                        }
                      />
                    );
                  });
                })
              )}
          </svg>

          {/* Render Layers Vertically from Top (Boss) to Bottom (Entry) */}
          {reversedLayers.map(({ layerIndex, nodeIds }) => {
            const isMidDepthHaven = layerIndex === 8 && currentDepth <= 3;
            const isBossLayer = layerIndex === totalLayers - 1;

            return (
              <div
                key={`layer_${layerIndex}`}
                className={`map-layer-row ${isMidDepthHaven ? 'haven-layer-row' : ''} ${
                  isBossLayer ? 'boss-layer-row' : ''
                }`}
              >
                <div className="map-layer-indicator">
                  <span className="layer-tag">層級 {layerIndex + 1}</span>
                  {isMidDepthHaven && (
                    <span className="haven-layer-tag" title="第 8 層中繼避難所：全圖安全休整點">
                      <Sparkles size={12} color="#74c69d" />
                      豐饒中繼站
                    </span>
                  )}
                  {isBossLayer && (
                    <span className="boss-layer-tag">
                      <Skull size={12} color="#ff4d5a" />
                      舊日宿敵
                    </span>
                  )}
                </div>

                <div className="map-layer-nodes">
                  {nodeIds.map((nodeId) => {
                    const node = map.nodes[nodeId];
                    if (!node) return null;
                    const config = NODE_TYPE_CONFIG[node.type];
                    const isAccessible = node.status === 'accessible';
                    const isCurrent = node.status === 'current';
                    const isVisited = node.status === 'visited';

                    return (
                      <div
                        key={node.id}
                        id={`map-node-${node.id}`}
                        className={`map-node-card ${node.type} ${node.status} ${
                          isAccessible ? 'candle-breathing' : ''
                        } ${isCurrent ? 'current-scroll-target' : ''}`}
                        onClick={() => handleNodeClick(node)}
                        title={
                          isAccessible
                            ? `點選前往【${node.title}】（${config.label}）`
                            : isCurrent
                            ? `當前停留處：【${node.title}】`
                            : isVisited
                            ? `已調查完畢：【${node.title}】`
                            : `尚未到達：【${node.title}】`
                        }
                      >
                        {/* Accessible Candlelight Breathing Micro-glow */}
                        {isAccessible && <div className="candle-aura-glow" />}

                        {/* Node Icon Avatar */}
                        <div className="map-node-icon-circle">
                          {isVisited ? (
                            <CheckCircle2 size={20} color="#74c69d" />
                          ) : isCurrent ? (
                            <Navigation size={22} color="#ffd700" className="current-pin" />
                          ) : isAccessible ? (
                            <div className="accessible-icon-wrapper">
                              {config.icon}
                              <Flame size={12} className="candle-spark" />
                            </div>
                          ) : (
                            config.icon
                          )}
                        </div>

                        {/* Node Texts */}
                        <div className="map-node-details">
                          <span className="map-node-type-label" style={{ color: config.color }}>
                            {config.label}
                          </span>
                          <h4 className="map-node-title">{node.title}</h4>
                          <p className="map-node-desc">{node.description}</p>
                        </div>

                        {/* Accessible indicator button */}
                        {isAccessible && (
                          <div className="map-node-enter-badge candle-button-glow">
                            <Flame size={12} color="#120e03" />
                            <span>啟程探索</span>
                          </div>
                        )}

                        {isCurrent && (
                          <div className="map-node-current-badge">
                            <span>目前位置</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Arkham Gazette Normal Victory or True Ending Sequence */}
      {map.isCompleted && (
        <ArkhamGazette
          endingType={state.isTrueEnding ? 'true_ending' : 'victory'}
          state={state}
          dispatch={dispatch}
        />
      )}
    </div>
  );
};
