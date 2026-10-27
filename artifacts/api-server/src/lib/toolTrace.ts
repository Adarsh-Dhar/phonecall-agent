/**
 * Structured tool-trace logging (S6)
 *
 * Logs structured tool-trace lines per agent tool call
 * with callId, tool, args, result, ms
 */

import { logger } from "./logger";

export interface ToolTrace {
  callId: string;
  tool: string;
  args: any;
  result: any;
  durationMs: number;
  timestamp: Date;
}

export function logToolTrace(trace: ToolTrace) {
  logger.info({
    type: 'tool_trace',
    callId: trace.callId,
    tool: trace.tool,
    args: trace.args,
    result: trace.result,
    durationMs: trace.durationMs,
    timestamp: trace.timestamp.toISOString(),
  }, 'Tool trace');
}

export function logToolCallStart(callId: string, tool: string, args: any) {
  logger.info({
    type: 'tool_call_start',
    callId,
    tool,
    args,
    timestamp: new Date().toISOString(),
  }, `Tool call started: ${tool}`);
}

export function logToolCallEnd(callId: string, tool: string, result: any, durationMs: number) {
  logger.info({
    type: 'tool_call_end',
    callId,
    tool,
    result,
    durationMs,
    timestamp: new Date().toISOString(),
  }, `Tool call ended: ${tool} (${durationMs}ms)`);
}
