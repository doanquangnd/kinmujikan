/**
 * Schema validation dùng Zod.
 * Dùng chung cho API backend, có thể export sang frontend nếu cần đồng bộ.
 */
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
  turnstile_response: z.string().optional(),
});

export const registerSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  display_name: z.string().max(100).optional().nullable(),
  turnstile_response: z.string().optional(),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Mật khẩu hiện tại là bắt buộc'),
  new_password: z.string().min(6, 'Mật khẩu mới tối thiểu 6 ký tự'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
