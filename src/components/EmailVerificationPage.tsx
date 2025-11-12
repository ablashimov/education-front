import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { apiClient } from '@/lib/api';

interface EmailVerificationPageProps {
  email: string;
  onVerified: () => void;
}

export function EmailVerificationPage({ email, onVerified }: EmailVerificationPageProps) {
  const location = useLocation();
  const [emailSent, setEmailSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('id');
    const hash = searchParams.get('hash');

    if (id && hash) {
      // Auto-verify if parameters are present
      handleVerify(parseInt(id), hash);
    }
  }, [location.search]);

  const handleResendEmail = async () => {
    try {
      setError(null);
      await apiClient.post('/email/verification-notification');
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send verification email');
    }
  };

  const handleVerify = async (id?: number, hash?: string) => {
    if (!id || !hash) {
      setError('Invalid verification parameters');
      return;
    }

    try {
      setVerifying(true);
      setError(null);
      await apiClient.post('/email/verify', { id, hash });
      setVerified(true);
      onVerified();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <CardTitle>Підтвердіть свій email</CardTitle>
          <CardDescription>
            Ми відправили лист підтвердження на {email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verified && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Email успішно підтверджено! Перенаправлення...
              </AlertDescription>
            </Alert>
          )}

          {emailSent && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Лист надіслано повторно
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Перевірте свою поштову скриньку та натисніть на посилання для підтвердження
            </p>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleResendEmail}
              disabled={emailSent || verifying || verified}
            >
              Надіслати лист повторно
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
