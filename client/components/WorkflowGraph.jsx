'use client';

import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

/**
 * Renders the stateful workflow visualization on a React Flow Canvas
 * @param {object} workflow - The current workflow document.
 * @param {Array} logs - Step logs for this workflow.
 * @param {Array} steps - Default execution sequence (e.g. ['resume_parser', ...]).
 * @param {object} colors - Spec colors and labels for node states.
 */
const WorkflowGraph = ({ workflow, logs = [], steps = [], colors = {} }) => {
  
  // Build nodes and edges dynamically based on step states
  const { nodes, edges } = useMemo(() => {
    if (!steps.length || !colors) return { nodes: [], edges: [] };

    // Group logs by agent name for quick status lookup
    const logsByAgent = {};
    logs.forEach(log => {
      logsByAgent[log.agent_name] = log;
    });

    const flowNodes = steps.map((step, index) => {
      const log = logsByAgent[step];
      let state = 'pending'; // default

      // Determine step state
      if (log) {
        if (log.status === 'success') {
          state = 'success';
        } else if (log.status === 'failed') {
          state = 'failed';
        } else if (log.status === 'waiting_approval') {
          state = 'waiting_approval';
        } else if (log.status === 'running') {
          state = 'running';
        }
      } else {
        // Fallback checks against workflow base properties
        if (workflow.current_state === step) {
          if (workflow.status === 'running') {
            state = 'running';
          } else if (workflow.status === 'waiting_approval') {
            state = 'waiting_approval';
          } else if (workflow.status === 'failed') {
            state = 'failed';
          }
        } else {
          // If we have passed this step but there's no logs (e.g. mock runs or jumps)
          const currentStepIndex = steps.indexOf(workflow.current_state);
          if (index < currentStepIndex) {
            state = 'success';
          }
        }
      }

      const styleConfig = colors[state] || colors.pending;
      const agentLabel = step.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      return {
        id: step,
        type: 'default',
        position: { x: index * 230 + 30, y: 80 },
        data: {
          label: (
            <div className="flex flex-col text-left gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Node {index + 1}</span>
              <span className="text-sm font-bold truncate">{agentLabel}</span>
              <div className="mt-2 flex items-center gap-1.5">
                <span 
                  className="h-2 w-2 rounded-full inline-block" 
                  style={{ backgroundColor: styleConfig.color }}
                ></span>
                <span className="text-[10px] font-bold" style={{ color: styleConfig.textColor }}>
                  {styleConfig.label}
                </span>
              </div>
              {log?.error && (
                <span className="text-[9px] text-red-500 font-semibold mt-1 border-t border-red-100 pt-1 line-clamp-1">
                  Error: {log.error}
                </span>
              )}
            </div>
          )
        },
        style: {
          background: styleConfig.background,
          borderColor: styleConfig.borderColor,
          borderWidth: '2px',
          color: '#1e293b',
          width: 190,
          borderRadius: '12px',
          padding: '12px',
          boxShadow: state === 'running' 
            ? '0 10px 15px -3px rgba(59, 130, 246, 0.2), 0 4px 6px -4px rgba(59, 130, 246, 0.2)' 
            : '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
        }
      };
    });

    // Build connections/edges
    const flowEdges = [];
    for (let i = 0; i < steps.length - 1; i++) {
      const source = steps[i];
      const target = steps[i + 1];
      
      const sourceLog = logsByAgent[source];
      const isAnimated = sourceLog && sourceLog.status === 'success';

      flowEdges.push({
        id: `edge-${source}-${target}`,
        source,
        target,
        animated: isAnimated,
        style: {
          stroke: isAnimated ? '#22c55e' : '#cbd5e1',
          strokeWidth: 2
        }
      });
    }

    return { nodes: flowNodes, edges: flowEdges };
  }, [workflow, logs, steps, colors]);

  return (
    <div className="h-64 w-full border border-slate-200 rounded-xl bg-slate-50/50 shadow-inner overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesConnectable={false}
        nodesDraggable={false}
        elementsSelectable={false}
      >
        <Background color="#cbd5e1" gap={16} size={1} />
        <Controls showInteractive={false} className="bg-white border border-slate-200 rounded-lg" />
      </ReactFlow>
    </div>
  );
};

export default WorkflowGraph;
