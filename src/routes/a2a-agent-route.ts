// src/routes/a2a-agent-route.ts
import { registerApiRoute } from '@mastra/core/server';
import { randomUUID } from 'crypto';

export const a2aAgentRoute = registerApiRoute('/a2a/agent/:agentId', {
  method: 'POST',
  handler: async (c) => {
    const mastra = c.get('mastra');
    const agentId = c.req.param('agentId');

    let body: any;
    try {
      body = await c.req.json();
    } catch (error) {
      // JSON parse failed (empty body, no body, malformed)
      body = null;
    }

    // THANO'S TRAP: Empty body → return 200 "pong"
    if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) {
      return c.json(
        {
          jsonrpc: '2.0',
          id: null,
          result: { message: 'Agent ready' },
        },
        200
      );
    }

    // === NORMAL A2A FLOW BELOW ===
    try {
      const { jsonrpc, id: requestId, method, params } = body;

      // Validate JSON-RPC 2.0
      if (jsonrpc !== '2.0' || !requestId) {
        return c.json(
          {
            jsonrpc: '2.0',
            id: requestId || null,
            error: {
              code: -32600,
              message: 'Invalid Request: jsonrpc must be "2.0" and id is required',
            },
          },
          400
        );
      }

      const agent = mastra.getAgent(agentId);
      if (!agent) {
        return c.json(
          {
            jsonrpc: '2.0',
            id: requestId,
            error: { code: -32602, message: `Agent '${agentId}' not found` },
          },
          404
        );
      }

      const { message, messages, contextId, taskId } = params || {};
      const messagesList = message ? [message] : Array.isArray(messages) ? messages : [];

      const mastraMessages = messagesList.map((msg: any) => ({
        role: msg.role,
        content:
          msg.parts
            ?.map((part: any) => {
              if (part.kind === 'text') return part.text;
              if (part.kind === 'data') return JSON.stringify(part.data);
              return '';
            })
            .join('\n') || '',
      }));

      const response = await agent.generate(mastraMessages);
      const agentText = response.text || '';

      const artifacts = [
        {
          artifactId: randomUUID(),
          name: `${agentId}Response`,
          parts: [{ kind: 'text', text: agentText }],
        },
      ];

      if (response.toolResults?.length) {
        artifacts.push({
          artifactId: randomUUID(),
          name: 'ToolResults',
          parts: response.toolResults.map((result: any) => ({
            kind: 'data',
            data: result,
          })),
        });
      }

      const history = [
        ...messagesList.map((msg: any) => ({
          kind: 'message',
          role: msg.role,
          parts: msg.parts,
          messageId: msg.messageId || randomUUID(),
          taskId: msg.taskId || taskId || randomUUID(),
        })),
        {
          kind: 'message',
          role: 'agent',
          parts: [{ kind: 'text', text: agentText }],
          messageId: randomUUID(),
          taskId: taskId || randomUUID(),
        },
      ];

      return c.json({
        jsonrpc: '2.0',
        id: requestId,
        result: {
          id: taskId || randomUUID(),
          contextId: contextId || randomUUID(),
          status: {
            state: 'completed',
            timestamp: new Date().toISOString(),
            message: {
              messageId: randomUUID(),
              role: 'agent',
              parts: [{ kind: 'text', text: agentText }],
              kind: 'message',
            },
          },
          artifacts,
          history,
          kind: 'task',
        },
      });
    } catch (error: any) {
      return c.json(
        {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32603,
            message: 'Internal error',
            data: { details: error.message },
          },
        },
        500
      );
    }
  },
});