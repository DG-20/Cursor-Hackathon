import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { useAuth } from '../context/AuthContext';
import { EARTH } from '@/styles/EARTH';

// Earthy greens & browns — forest floor palette
const priorityColors = {
  urgent: 'rgba(180, 100, 70, 0.92)',   // warm clay
  high: 'rgba(95, 145, 85, 0.9)',       // forest green
  medium: 'rgba(155, 140, 100, 0.85)',  // driftwood
  low: 'rgba(110, 130, 95, 0.7)',       // fern
};

const CENTER_R = 260;
const SUBTASK_R = 120;
const MIN_TASK_R = 26;
const MAX_TASK_R = 60;
const MIN_SUBTASK_R = 18;
const MAX_SUBTASK_R = 38;
const CENTER_NODE_R = 48;
const CHARS_PER_UNIT_TASK = 5.2;
const CHARS_PER_UNIT_SUBTASK = 5;
const PADDING_TASK = 18;
const PADDING_SUBTASK = 14;
const MAX_WORDS_TASK = 5;
const MAX_WORDS_SUBTASK = 4;

// Paraphrase to max words so it fits in the node; return { short, full }
function shortTaskTitle(title, maxWords = MAX_WORDS_TASK) {
  const t = (title || '').trim();
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return { short: t, full: t };
  const short = words.slice(0, maxWords).join(' ') + '…';
  return { short, full: t };
}
function shortSubtaskTitle(title, maxWords = MAX_WORDS_SUBTASK) {
  const t = (title || '').trim();
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return { short: t, full: t };
  const short = words.slice(0, maxWords).join(' ') + '…';
  return { short, full: t };
}

// Radius so text fits inside circle (approx: half width + padding, then clamp)
function taskRadius(displayTextLen) {
  const r = Math.ceil((displayTextLen * CHARS_PER_UNIT_TASK) / 2) + PADDING_TASK;
  return Math.min(MAX_TASK_R, Math.max(MIN_TASK_R, r));
}
function subtaskRadius(displayTextLen) {
  const r = Math.ceil((displayTextLen * CHARS_PER_UNIT_SUBTASK) / 2) + PADDING_SUBTASK;
  return Math.min(MAX_SUBTASK_R, Math.max(MIN_SUBTASK_R, r));
}

// Top of viewBox in same coords as layout; if a node would sit above this, nudge its angle to the side
const TOP_SAFE_Y = -240;
const TOP_NUDGE_ANGLE = 0.28;

// Radial positions: center (0,0), tasks on circle, subtasks on arc; top-heavy nodes nudged to the side
function useLayout(tasks) {
  return useMemo(() => {
    const n = tasks?.length || 0;
    const taskPositions = [];
    const subtaskPositions = {}; // taskId -> [{ x, y, ...subtask }]

    for (let i = 0; i < n; i++) {
      let angle = (i / n) * Math.PI * 2 - Math.PI / 2; // start from top
      const task = tasks[i];
      const subs = task.subtasks || [];
      // If this task (or its subtasks) would hit the top, nudge angle to the side
      const taskY = CENTER_R * Math.sin(angle);
      const subtaskTopY = subs.length
        ? taskY + SUBTASK_R * Math.sin(angle + (subs.length > 1 ? 0.35 : 0))
        : taskY;
      if (subtaskTopY < TOP_SAFE_Y || taskY < TOP_SAFE_Y) {
        angle += TOP_NUDGE_ANGLE;
      }
      const x = CENTER_R * Math.cos(angle);
      const y = CENTER_R * Math.sin(angle);
      taskPositions.push({ x, y, task, angle });
    }

    taskPositions.forEach(({ x, y, task }) => {
      const subs = task.subtasks || [];
      const out = [];
      const baseAngle = Math.atan2(y, x);
      const spread = Math.min(1.2, (subs.length || 1) * 0.35);
      for (let j = 0; j < subs.length; j++) {
        const a = baseAngle + (j - (subs.length - 1) / 2) * spread;
        out.push({
          x: x + SUBTASK_R * Math.cos(a),
          y: y + SUBTASK_R * Math.sin(a),
          subtask: subs[j],
        });
      }
      subtaskPositions[task.id] = out;
    });

    return { taskPositions, subtaskPositions };
  }, [tasks]);
}

// ViewBox dimensions (logical units)
const VB_WIDTH = 560;
const VB_HEIGHT = 540;
const VB_MIN_X = -280;
const VB_MIN_Y = -320;
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 4;

// Quadratic curve from (x1,y1) to (x2,y2) with slight bend
function curvePath(x1, y1, x2, y2, bend = 0.3) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const perpX = -dy * bend;
  const perpY = dx * bend;
  const cpx = mx + perpX;
  const cpy = my + perpY;
  return `M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`;
}

export default function MindMap() {
  const navigate = useNavigate();
  const { currentSession } = useSession();
  const { user, signOut } = useAuth();
  const [hideCompleted, setHideCompleted] = useState(false);
  const containerRef = useRef(null);

  // Pan & zoom: initial view shows whole map (same as viewBox -280 -320 560 540); then user can pan/zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: -30 });
  const panStart = useRef({ clientX: 0, clientY: 0, panX: 0, panY: 0 });

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    panStart.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [pan.x, pan.y]);

  const handleMouseMove = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const scaleX = (VB_WIDTH / zoom) / rect.width;
    const scaleY = (VB_HEIGHT / zoom) / rect.height;
    setPan({
      x: panStart.current.panX - (e.clientX - panStart.current.clientX) * scaleX,
      y: panStart.current.panY - (e.clientY - panStart.current.clientY) * scaleY,
    });
  }, [zoom]);

  const handleMouseUp = useCallback(() => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.04 : 0.04;
      setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z * (1 + delta))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const handleSignOut = () => {
    navigate('/', { replace: true });
    signOut();
    window.location.reload();
  };

  if (!currentSession?.tasks?.length) {
    navigate('/results/list');
    return null;
  }

  const tasks = hideCompleted
    ? currentSession.tasks.filter(t => {
      if (t.subtasks?.length) {
        const done = t.subtasks.filter(s => s.completed).length;
        return done < t.subtasks.length;
      }
      return !t.completed;
    })
    : currentSession.tasks;

  const { taskPositions, subtaskPositions } = useLayout(tasks);

  const MAP_TOP_OFFSET = 'max(2.5rem, 8vh)';
  const viewBoxCenterY = -20;
  const viewBox = `${pan.x - VB_WIDTH / (2 * zoom)} ${viewBoxCenterY + pan.y - VB_HEIGHT / (2 * zoom)} ${VB_WIDTH / zoom} ${VB_HEIGHT / zoom}`;

  return (
    <div className="h-screen flex flex-col relative overflow-hidden" style={{ background: EARTH.bg }}>
      {/* Breathing background orbs — earthy */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute rounded-full"
          style={{
            width: '500px',
            height: '500px',
            top: '-150px',
            left: '-150px',
            background: `radial-gradient(circle, ${EARTH.orb1} 0%, transparent 70%)`,
            filter: 'blur(50px)',
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: '500px',
            height: '500px',
            bottom: '-150px',
            right: '-150px',
            background: `radial-gradient(circle, ${EARTH.orb2} 0%, transparent 70%)`,
            filter: 'blur(50px)',
          }}
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.5, 0.9, 0.5],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Header — earth tones */}
      <div
        className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between shrink-0"
        style={{
          background: `rgba(20, 30, 22, 0.92)`,
          borderBottom: `1px solid ${EARTH.borderMuted}`,
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/results/list')}
            className="flex cursor-pointer  items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${EARTH.borderMuted}`,
              color: EARTH.textMuted,
              fontFamily: 'var(--font-sans)',
              fontSize: '0.8125rem',
            }}
          >
            <ArrowLeft size={16} />
            List
          </button>
          <button
            onClick={() => setHideCompleted(!hideCompleted)}
            className="flex items-center cursor-pointer  gap-2 px-3 py-2 rounded-lg transition-all duration-300"
            style={{
              background: hideCompleted ? 'rgba(75, 120, 65, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${EARTH.border}`,
              color: EARTH.textMuted,
              fontFamily: 'var(--font-sans)',
              fontSize: '0.8125rem',
            }}
          >
            {hideCompleted ? <Eye size={14} /> : <EyeOff size={14} />}
            {hideCompleted ? 'Show done' : 'Hide done'}
          </button>
        </div>
        <div className="flex items-center gap-3" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8125rem', color: EARTH.textMuted }}>
          <button
            type="button"
            onClick={() => navigate('/landing')}
            className="px-3 py-2 rounded-lg transition-all cursor-pointer duration-200"
            style={{
              background: 'rgba(75, 120, 65, 0.15)',
              border: `1px solid ${EARTH.border}`,
              color: 'rgba(130, 175, 120, 0.8)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.8125rem',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(75, 120, 65, 0.28)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(75, 120, 65, 0.15)'}
          >
            + New Session
          </button>
          <button type="button" onClick={handleSignOut} className="hover:underline cursor-pointer ">Sign out</button>
        </div>
      </div>

      {/* Mind map — pan/zoom; initial view fits whole map (meet), then interactable */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 relative z-10 flex items-center justify-center pb-2 select-none cursor-grab active:cursor-grabbing"
        style={{ paddingTop: MAP_TOP_OFFSET }}
        onMouseDown={handleMouseDown}
      >
        <motion.svg
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full touch-none"
          style={{ display: 'block', minWidth: 0, minHeight: 0 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <defs>
            <filter id="glow-center" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="centerFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={EARTH.centerFill[0]} />
              <stop offset="100%" stopColor={EARTH.centerFill[1]} />
            </linearGradient>
          </defs>

          {/* Curved edges: center -> tasks (draw-in then subtle flow) */}
          <g fill="none">
            {taskPositions.map(({ x, y }, i) => (
              <g key={i}>
                <motion.path
                  d={curvePath(0, 0, x, y)}
                  stroke={EARTH.edge}
                  strokeWidth="1.2"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.08 }}
                />
                <motion.path
                  d={curvePath(0, 0, x, y)}
                  stroke={EARTH.edgeFlow}
                  strokeWidth="1"
                  strokeDasharray="8 24"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: 1,
                    opacity: 0.7,
                    strokeDashoffset: [0, -32],
                  }}
                  transition={{
                    pathLength: { duration: 0.8, delay: 0.2 + i * 0.08 },
                    strokeDashoffset: { duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 0 },
                  }}
                />
              </g>
            ))}
          </g>

          {/* Edges: task -> subtasks */}
          {taskPositions.map(({ x, y, task }) =>
            (subtaskPositions[task.id] || []).map((sub, j) => (
              <motion.path
                key={`${task.id}-${sub.subtask.id}`}
                d={curvePath(x, y, sub.x, sub.y)}
                stroke={EARTH.edge}
                strokeWidth="1"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 + j * 0.05 }}
              />
            ))
          )}

          {/* Center node — pulsing only, no text */}
          <g filter="url(#glow-center)">
            <motion.circle
              r={CENTER_NODE_R}
              fill="url(#centerFill)"
              stroke={EARTH.centerStroke}
              strokeWidth="1.5"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            />
            <motion.circle
              r={CENTER_NODE_R}
              fill="none"
              stroke={EARTH.centerStroke}
              strokeWidth="1"
              style={{ opacity: 0.4 }}
              animate={{
                r: [CENTER_NODE_R, CENTER_NODE_R + 12, CENTER_NODE_R],
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </g>

          {/* Task nodes — circle sized to short text (max 5 words); hover shows full title */}
          {taskPositions.map(({ x, y, task }, i) => {
            const isDone = task.subtasks?.length
              ? task.subtasks.every(s => s.completed)
              : task.completed;
            const color = priorityColors[task.priority] || priorityColors.medium;
            const { short: displayTitle, full: fullTitle } = shortTaskTitle(task.title);
            const nodeR = taskRadius(displayTitle.length);
            return (
              <g key={task.id} transform={`translate(${x}, ${y})`}>
                <title>{fullTitle}</title>
                <motion.circle
                  r={nodeR}
                  fill={EARTH.bgCard}
                  stroke={color}
                  strokeWidth="2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: 1,
                    opacity: isDone && hideCompleted ? 0 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 140, damping: 20, delay: 0.15 + i * 0.06 }}
                  style={{ opacity: isDone ? 0.55 : 1 }}
                />
                <motion.circle
                  r={nodeR}
                  fill="none"
                  stroke={color}
                  strokeWidth="1"
                  style={{ opacity: 0.4 }}
                  animate={{
                    r: [nodeR, nodeR + 5, nodeR],
                    opacity: [0.2, 0.5, 0.2],
                  }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.2,
                  }}
                />
                <text
                  x="0"
                  y="0"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '10px',
                    fill: EARTH.text,
                    fontWeight: '500',
                    pointerEvents: 'none',
                  }}
                >
                  {displayTitle}
                </text>
              </g>
            );
          })}

          {/* Subtask nodes — circle sized to short text (max 4 words); hover shows full title */}
          {taskPositions.map(({ x, y, task }) =>
            (subtaskPositions[task.id] || []).map((sub, j) => {
              const done = sub.subtask.completed;
              const { short: displayTitle, full: fullTitle } = shortSubtaskTitle(sub.subtask.title);
              const nodeR = subtaskRadius(displayTitle.length);
              return (
                <g key={sub.subtask.id} transform={`translate(${sub.x}, ${sub.y})`}>
                  <title>{fullTitle}</title>
                  <motion.circle
                    r={nodeR}
                    fill={EARTH.bgCard}
                    stroke={done ? EARTH.nodeDone : EARTH.edgeFlow}
                    strokeWidth="1.2"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.3 + j * 0.04 }}
                    style={{ opacity: done ? 0.6 : 1 }}
                  />
                  <motion.circle
                    r={nodeR}
                    fill="none"
                    stroke={EARTH.edge}
                    strokeWidth="0.8"
                    animate={{
                      r: [nodeR, nodeR + 3, nodeR],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: j * 0.15,
                    }}
                  />
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '8px',
                      fill: done ? EARTH.textDim : EARTH.textMuted,
                      fontWeight: '400',
                      textDecoration: done ? 'underline' : 'none',
                    }}
                  >
                    {displayTitle}
                  </text>
                </g>
              );
            })
          )}
        </motion.svg>
      </div>

      {/* Subtle hint */}
      <div
        className="text-center py-2 relative z-10 shrink-0"
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.75rem',
          color: EARTH.textDim,
        }}
      >
        <Sparkles size={12} className="inline mr-1" />
        Drag to pan · Scroll to zoom · List to manage tasks
      </div>
    </div>
  );
}
