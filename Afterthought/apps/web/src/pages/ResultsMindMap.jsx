import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { X, ArrowRight } from 'lucide-react';
import { useSession } from '../context/SessionContext';

const PRIORITY_COLORS = {
  urgent: '#ef4444',
  high:   '#f97316',
  medium: '#a78bfa',
  low:    '#34d399',
};
const FALLBACKS = ['#60a5fa','#f472b6','#facc15','#4ade80','#38bdf8','#e879f9'];

function getColor(task, index) {
  return PRIORITY_COLORS[task.priority] || FALLBACKS[index % FALLBACKS.length];
}

const CX = 400, CY = 280;
const CAT_R = 185, LEAF_R = 310;

function polar(angle, r) {
  return { x: CX + Math.cos(angle) * r, y: CY + Math.sin(angle) * r };
}

function bezierPath(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const cx1 = x1 + dx * 0.4 + dy * 0.18;
  const cy1 = y1 + dy * 0.4 - dx * 0.18;
  const cx2 = x1 + dx * 0.6 + dy * 0.1;
  const cy2 = y1 + dy * 0.6 - dx * 0.1;
  return `M${x1},${y1} C${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`;
}

export default function ResultsMindMap() {
  const navigate = useNavigate();
  const svgRef  = useRef(null);
  const wrapRef = useRef(null);
  const drag    = useRef({ active: false, ox: 0, oy: 0, tx: 0, ty: 0 });
  const { currentSession, endSession } = useSession();

  const handleEndSession = () => { endSession(); navigate('/'); };

  useEffect(() => {
    if (!currentSession?.tasks) { navigate('/'); return; }
    const svg = svgRef.current;
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const ns = 'http://www.w3.org/2000/svg';
    const mk = (tag, attrs = {}) => {
      const el = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      return el;
    };

    const edgeLayer = mk('g');
    const nodeLayer = mk('g');
    svg.appendChild(edgeLayer);
    svg.appendChild(nodeLayer);

    const tasks = currentSession.tasks;
    const N = tasks.length;

    // Task node pill
    const makePill = (parent, x, y, label, color, isRoot) => {
      const ht  = isRoot ? 48 : 36;
      const fs  = isRoot ? 15 : 13;
      const fw  = isRoot ? 700 : 600;
      const pad = isRoot ? 28 : 22;
      const tw  = Math.max(label.length * (fs * 0.61) + pad * 2, isRoot ? 120 : 80);

      const g = mk('g', { style: 'cursor:pointer' });
      g.appendChild(mk('rect', {
        x: x - tw / 2, y: y - ht / 2,
        width: tw, height: ht,
        rx: ht / 2,
        fill: isRoot ? color : '#1c1f30',
        stroke: color,
        'stroke-width': isRoot ? 0 : 2.5,
      }));

      const text = mk('text', {
        x, y,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        'font-size': fs,
        'font-weight': fw,
        fill: isRoot ? '#fff' : '#dde1f5',
        'font-family': 'inherit',
      });
      text.textContent = label;
      g.appendChild(text);
      parent.appendChild(g);
    };

    // Subtask leaf — small pill with colored border
    const makeLeaf = (parent, x, y, label, color) => {
      const fs = 11;
      const tw = Math.max(label.length * (fs * 0.6) + 22, 56);
      const ht = 25;

      const g = mk('g');
      g.appendChild(mk('rect', {
        x: x - tw / 2, y: y - ht / 2,
        width: tw, height: ht,
        rx: 6,
        fill: '#13152200',
        stroke: color,
        'stroke-width': 1.5,
        opacity: '0.75',
      }));
      const text = mk('text', {
        x, y,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        'font-size': fs,
        'font-weight': 500,
        fill: 'rgba(210,215,240,0.75)',
        'font-family': 'inherit',
      });
      text.textContent = label;
      g.appendChild(text);
      parent.appendChild(g);
    };

    tasks.forEach((task, i) => {
      const color = getColor(task, i);
      const angle = (2 * Math.PI * i / N) - Math.PI / 2;
      const cp    = polar(angle, CAT_R);

      // Spoke
      edgeLayer.appendChild(mk('path', {
        d: bezierPath(CX, CY, cp.x, cp.y),
        fill: 'none', stroke: color,
        'stroke-width': 2, opacity: '0.4',
      }));

      makePill(nodeLayer, cp.x, cp.y, task.title, color, false);

      if (task.subtasks?.length) {
        const spread = 0.5;
        task.subtasks.forEach((sub, j) => {
          const fanA = angle + (task.subtasks.length === 1
            ? 0
            : spread * (j / (task.subtasks.length - 1) - 0.5));
          const lp = polar(fanA, LEAF_R);

          edgeLayer.appendChild(mk('path', {
            d: bezierPath(cp.x, cp.y, lp.x, lp.y),
            fill: 'none', stroke: color,
            'stroke-width': 1.5, opacity: '0.2',
          }));

          const subLabel = typeof sub === 'string' ? sub : sub.title;
          makeLeaf(nodeLayer, lp.x, lp.y, subLabel, color);
        });
      }
    });

    makePill(nodeLayer, CX, CY, currentSession.session_theme || "Today's focus", '#6c63f5', true);

  }, [currentSession, navigate]);

  useEffect(() => {
    const wrap = wrapRef.current, svg = svgRef.current;
    if (!wrap || !svg) return;
    const d = drag.current;

    const VW = 800, VH = 560;
    if (d.vx === undefined) { d.vx = 0; d.vy = 0; }

    const updateViewBox = () => {
      svg.setAttribute('viewBox', `${d.vx} ${d.vy} ${VW} ${VH}`);
    };
    updateViewBox();

    const onDown = e => {
      d.active = true;
      d.ox = e.clientX;
      d.oy = e.clientY;
      d.startVx = d.vx;
      d.startVy = d.vy;
      wrap.style.cursor = 'grabbing';
    };
    const onMove = e => {
      if (!d.active) return;
      const rect = wrap.getBoundingClientRect();
      const scaleX = VW / rect.width;
      const scaleY = VH / rect.height;
      d.vx = d.startVx - (e.clientX - d.ox) * scaleX;
      d.vy = d.startVy - (e.clientY - d.oy) * scaleY;
      updateViewBox();
    };
    const onUp = () => { d.active = false; wrap.style.cursor = 'grab'; };

    wrap.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      wrap.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return (
    <div style={{
      background: '#0d0f1a',
      display: 'flex', flexDirection: 'column',
      height: '100dvh', overflow: 'hidden',
    }}>

      {/* Top bar */}
      <div style={{
        flexShrink: 0, height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6c63f5' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
            {currentSession?.session_theme || "Today's focus"}
          </span>
        </div>

        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>

        <button
          onClick={handleEndSession}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'rgba(255,255,255,0.45)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, padding: '6px 13px',
            background: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontWeight: 500,
          }}
        >
          <X size={14} />
          End session
        </button>
      </div>

      {/* SVG canvas */}
      <div
        ref={wrapRef}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: 'grab', minHeight: 0 }}
      >
        <svg
          ref={svgRef}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        />
      </div>

      {/* Bottom bar */}
      <div style={{
        flexShrink: 0, height: 64,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        <motion.button
          onClick={() => navigate('/results/list')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#6c63f5', color: '#fff', border: 'none',
            borderRadius: 12, padding: '12px 26px',
            fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Let's manage it all together
          <ArrowRight size={16} />
        </motion.button>
      </div>
    </div>
  );
}