import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';

/**
 * Sign up: create a new user. Supabase Auth hashes the password (never stored plaintext).
 * Confirm password is validated on the frontend only; password is verified when user signs in.
 * POST /api/auth/signup { email, password, first_name }
 */
export async function signUp(req: Request, res: Response) {
  try {
    const { email, password, first_name } = req.body ?? {};
    if (!email || typeof email !== 'string' || !email.trim()) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    if (!first_name || typeof first_name !== 'string' || !first_name.trim()) {
      res.status(400).json({ error: 'First name is required' });
      return;
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password is required and must be at least 6 characters' });
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: undefined,
        data: { first_name: first_name.trim() },
      },
    });

    if (error) {
      const status = error.message?.toLowerCase().includes('already registered') ? 409 : 400;
      res.status(status).json({ error: error.message });
      return;
    }

    const user = data.user
      ? {
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at,
          first_name: (data.user.user_metadata?.first_name as string) || first_name.trim(),
        }
      : null;

    res.status(201).json({
      user,
      session: data.session
        ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
          }
        : null,
      message: data.user && !data.session ? 'Check your email to confirm sign up' : 'Signed up',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign up failed';
    console.error('signUp error:', message);
    res.status(500).json({ error: message });
  }
}

/**
 * Sign in: validate email/password. Supabase compares against stored hash.
 * POST /api/auth/signin { email, password }
 */
export async function signIn(req: Request, res: Response) {
  try {
    const { email, password } = req.body ?? {};
    if (!email || typeof email !== 'string' || !email.trim()) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    if (!password || typeof password !== 'string') {
      res.status(400).json({ error: 'Password is required' });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      const status = error.message?.toLowerCase().includes('invalid login') ? 401 : 400;
      res.status(status).json({ error: error.message });
      return;
    }

    const first_name = (data.user.user_metadata?.first_name as string) || null;
    res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
        first_name,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign in failed';
    console.error('signIn error:', message);
    res.status(500).json({ error: message });
  }
}

/**
 * Get current user from Bearer token. For testing protected routes.
 * GET /api/auth/me  Header: Authorization: Bearer <access_token>
 */
export async function me(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      res.status(401).json({ error: 'Missing Authorization: Bearer <token>' });
      return;
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error) {
      res.status(401).json({ error: error.message });
      return;
    }
    if (!user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    const first_name = (user.user_metadata?.first_name as string) || null;
    res.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        first_name,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Auth check failed';
    console.error('me error:', message);
    res.status(500).json({ error: message });
  }
}
