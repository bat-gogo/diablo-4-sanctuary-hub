import { z } from 'zod';

export const registerSchema = z.object({
  battletag: z
    .string()
    .min(3)
    .max(64)
    .regex(
      /^[a-zA-Z][a-zA-Z0-9]{2,11}#[0-9]{4,10}$/,
      'Battletag must be in format Name#1234',
    ),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
