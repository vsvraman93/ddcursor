import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Link,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { validatePassword, generateSessionId } from '../../utils/security';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  useEffect(() => {
    // Check for existing lockout
    const storedLockout = localStorage.getItem('loginLockout');
    if (storedLockout) {
      const lockoutTime = parseInt(storedLockout);
      if (Date.now() < lockoutTime) {
        setLockoutUntil(lockoutTime);
      } else {
        localStorage.removeItem('loginLockout');
      }
    }
  }, []);

  const isLockedOut = () => {
    if (!lockoutUntil) return false;
    if (Date.now() >= lockoutUntil) {
      setLockoutUntil(null);
      localStorage.removeItem('loginLockout');
      return false;
    }
    return true;
  };

  const handleLockout = () => {
    const newLockoutTime = Date.now() + LOCKOUT_DURATION;
    setLockoutUntil(newLockoutTime);
    localStorage.setItem('loginLockout', newLockoutTime.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLockedOut()) {
      const remainingTime = Math.ceil((lockoutUntil! - Date.now()) / 60000);
      setError(`Too many login attempts. Please try again in ${remainingTime} minutes.`);
      return;
    }

    try {
      setError('');
      setLoading(true);

      // Validate password format
      if (!validatePassword(password)) {
        throw new Error('Invalid password format');
      }

      // Generate a new session ID
      const sessionId = generateSessionId();
      localStorage.setItem('sessionId', sessionId);

      await signIn(email, password);
      
      // Reset login attempts on successful login
      setLoginAttempts(0);
      navigate('/dashboard');
    } catch (err) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        handleLockout();
        setError('Too many failed attempts. Account locked for 15 minutes.');
      } else {
        setError(`Failed to sign in. ${MAX_LOGIN_ATTEMPTS - newAttempts} attempts remaining.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5">
            Sign in to DDCursor
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLockedOut()}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLockedOut()}
              helperText="Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || isLockedOut()}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Link href="/forgot-password" variant="body2">
                Forgot password?
              </Link>
              <Link href="/signup" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}; 