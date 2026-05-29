import { tool } from 'ai';
import z from 'zod';
import { TodoItem } from '../types.js';

export function createUpdateTodoTool(onUpdate: (todos: TodoItem[]) => Promise<void>) {
  return tool({
    description: 'Update the todo list to track review progress. Call this whenever a todo item changes status.',
    inputSchema: z.object({
      todos: z.array(z.object({
        content: z.string(),
        status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
      })),
    }),
    execute: async ({ todos }) => {
      // Trigger the side effect to save to DB
      await onUpdate(todos as TodoItem[]);
      return { success: true, message: 'Todo list updated successfully.', todos };
    },
  });
}
