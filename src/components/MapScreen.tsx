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
};

/**
 * 計算地圖節點在 SVG 畫布中的相對百分比與縱向像素座標
 */
function getNodeCoordinates(node: MapNode, map: InvestigationMap): { x: string; y: string } {
  const layerLength = map.layers[node.layer]?.length ?? 1;
  return {
    x: `${(node.col + 1) * (100 / (layerLength + 1))}%`,
    y: `${node.layer * 130 + 60}px`,
  };
}

export const MapScreen: React.FC<MapScreenProps> = ({ state, dispatch }) => {
  const map = state.map;
  const investigator = state.investigator;

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

  if (!map) {
    return (
      <div className="map-screen-container">
        <p>地圖資料加載中……</p>
      </div>
    );
  }

  return (
    <div className="map-screen-container">
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
          <h2 className="map-header-title">阿卡姆封鎖區 · 調查路線圖</h2>
          <span className="map-header-subtitle">選擇連通節點啟程探索，步步逼近未知的深淵祭壇</span>
        </div>

        <div className="map-header-right">
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

      {/* Main Map DAG Viewport */}
      <main className="map-viewport">
        <div className="map-canvas">
          {/* SVG Connecting Lines between reachable nodes */}
          <svg className="map-connections-svg">
            {map.layers.map((layerNodeIds) =>
              layerNodeIds.map((nodeId) => {
                const node = map.nodes[nodeId];
                if (!node || !node.nextNodes.length) return null;

                // Connect from this node to its next nodes
                return node.nextNodes.map((targetId) => {
                  const target = map.nodes[targetId];
                  if (!target) return null;

                  const isPathAvailable =
                    (node.status === 'current' && target.status === 'accessible') ||
                    (node.status === 'visited' && (target.status === 'visited' || target.status === 'current'));

                  const sourceCoord = getNodeCoordinates(node, map);
                  const targetCoord = getNodeCoordinates(target, map);

                  return (
                    <line
                      key={`${node.id}->${target.id}`}
                      x1={sourceCoord.x}
                      y1={sourceCoord.y}
                      x2={targetCoord.x}
                      y2={targetCoord.y}
                      stroke={isPathAvailable ? '#d4af37' : 'rgba(255, 255, 255, 0.15)'}
                      strokeWidth={isPathAvailable ? 2.5 : 1.5}
                      strokeDasharray={isPathAvailable ? 'none' : '4 4'}
                      className={isPathAvailable ? 'map-line-active' : 'map-line-inactive'}
                    />
                  );
                });
              })
            )}
          </svg>

          {/* Render Nodes by Layer */}
          {map.layers.map((layerNodeIds, layerIndex) => (
            <div key={`layer_${layerIndex}`} className="map-layer-row">
              <div className="map-layer-indicator">
                <span>層級 {layerIndex + 1}</span>
              </div>

              <div className="map-layer-nodes">
                {layerNodeIds.map((nodeId) => {
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
                      className={`map-node-card ${node.type} ${node.status}`}
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
                      {/* Node Icon Avatar */}
                      <div className="map-node-icon-circle">
                        {isVisited ? (
                          <CheckCircle2 size={20} color="#74c69d" />
                        ) : isCurrent ? (
                          <Navigation size={22} color="#ffd700" className="current-pin" />
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
                        <div className="map-node-enter-badge">
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
          ))}
        </div>
      </main>

      {/* Arkham Gazette Normal Victory Ending Sequence */}
      {map.isCompleted && (
        <ArkhamGazette
          endingType="victory"
          state={state}
          dispatch={dispatch}
        />
      )}
    </div>
  );
};
