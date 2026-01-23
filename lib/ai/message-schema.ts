import { z } from 'zod';

export const MessagePartSchema = z.union([
    z.object({
        type: z.literal('text'),
        text: z.string(),
    }),
    z.object({
        type: z.literal('image'),
        image: z.string().optional(), // URL ou base64
        image_url: z.any().optional(), // Compatibilidade
    }),
    // Adicionar suporte para tool calls se necessário
    z.object({
        type: z.literal('tool-call'),
        toolCallId: z.string(),
        toolName: z.string(),
        args: z.any(),
    }).passthrough(),
    z.object({
        type: z.literal('tool-result'),
        toolCallId: z.string(),
        toolName: z.string(),
        result: z.any(),
    }).passthrough(),
]);

export const UIMessageSchema = z.object({
    id: z.string().optional(),
    role: z.enum(['user', 'assistant', 'system', 'developer', 'function', 'tool']),
    content: z.union([
        z.string(),
        z.array(MessagePartSchema),
    ]),
    createdAt: z.union([z.date(), z.string(), z.number()]).optional(),
    // Campos experimentais e legados
    parts: z.array(z.any()).optional(),
});

export type UIMessage = z.infer<typeof UIMessageSchema>;
