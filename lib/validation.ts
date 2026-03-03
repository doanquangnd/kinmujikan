/**
 * Schema validation dùng Zod.
 * Dùng chung cho API backend, có thể export sang frontend nếu cần đồng bộ.
 */
import { z } from 'zod';

/** Mật khẩu mạnh: min 8 ký tự, có chữ hoa, chữ thường, số */
const strongPassword = z
  .string()
  .min(8, 'Mật khẩu tối thiểu 8 ký tự')
  .regex(/[A-Z]/, 'Mật khẩu cần ít nhất 1 chữ in hoa')
  .regex(/[a-z]/, 'Mật khẩu cần ít nhất 1 chữ thường')
  .regex(/\d/, 'Mật khẩu cần ít nhất 1 chữ số');

export const loginSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
  turnstile_response: z.string().optional(),
});

export const registerSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  password: strongPassword,
  display_name: z.string().max(100).optional().nullable(),
  turnstile_response: z.string().optional(),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Mật khẩu hiện tại là bắt buộc'),
  new_password: strongPassword,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
