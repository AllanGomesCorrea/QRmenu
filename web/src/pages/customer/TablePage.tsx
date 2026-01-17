import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Loader2, 
  AlertCircle, 
  QrCode, 
  Phone, 
  User,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getFingerprint, getDeviceInfo } from '@/services/fingerprint';
import { useSessionStore } from '@/stores/sessionStore';
import {
  useTableStatus,
  useCheckExistingSession,
  useRequestCode,
  useCreateSession,
  useVerifyCode,
} from '@/hooks/useSession';

const registrationSchema = z.object({
  customerName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  customerPhone: z.string().min(10, 'Telefone inválido').max(11, 'Telefone inválido'),
});

const verificationSchema = z.object({
  code: z.string().length(6, 'Código deve ter 6 dígitos'),
});

type RegistrationForm = z.infer<typeof registrationSchema>;
type VerificationForm = z.infer<typeof verificationSchema>;

type Step = 'loading' | 'error' | 'inactive' | 'register' | 'verify' | 'success';

export default function TablePage() {
  const { slug, qrCode } = useParams<{ slug: string; qrCode: string }>();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<Step>('loading');
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [registrationData, setRegistrationData] = useState<RegistrationForm | null>(null);
  
  const setSessionFingerprint = useSessionStore((state) => state.setFingerprint);
  const existingSession = useSessionStore((state) => state.session);

  // Queries
  const { data: tableStatus, isLoading: loadingStatus, error: statusError } = useTableStatus(qrCode!);
  const { data: existingCheck } = useCheckExistingSession(qrCode!, fingerprint);

  // Mutations
  const requestCode = useRequestCode();
  const createSession = useCreateSession();
  const verifyCode = useVerifyCode();

  // Forms
  const registrationForm = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
  });

  const verificationForm = useForm<VerificationForm>({
    resolver: zodResolver(verificationSchema),
  });

  // Load fingerprint on mount
  useEffect(() => {
    async function loadFingerprint() {
      try {
        const fp = await getFingerprint();
        setFingerprint(fp);
        setSessionFingerprint(fp);
      } catch (error) {
        console.error('Error loading fingerprint:', error);
      }
    }
    loadFingerprint();
  }, [setSessionFingerprint]);

  // Check table status and existing session
  useEffect(() => {
    if (loadingStatus || !fingerprint) return;

    if (statusError) {
      setStep('error');
      setErrorMessage('Mesa não encontrada ou não disponível');
      return;
    }

    if (tableStatus) {
      // Check if table is inactive
      if (tableStatus.table.status === 'INACTIVE') {
        setStep('inactive');
        return;
      }

      // Check for existing verified session
      if (existingSession?.isVerified && existingSession?.restaurantSlug === slug) {
        // Already has a valid session, redirect to menu
        navigate(`/r/${slug}`);
        return;
      }

      // Check for existing session on this device
      if (existingCheck?.hasSession && existingCheck.session?.isVerified) {
        // Session exists and is verified
        navigate(`/r/${slug}`);
        return;
      }

      // Show registration form
      setStep('register');
    }
  }, [tableStatus, loadingStatus, statusError, fingerprint, existingCheck, existingSession, slug, navigate]);

  // Handle registration submission
  const handleRegistration = async (data: RegistrationForm) => {
    if (!fingerprint || !qrCode) return;

    try {
      setRegistrationData(data);
      const deviceInfo = getDeviceInfo();

      // Create session
      await createSession.mutateAsync({
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        qrCode,
        deviceFingerprint: fingerprint,
        userAgent: deviceInfo.userAgent,
      });

      // Request verification code
      await requestCode.mutateAsync({
        customerPhone: data.customerPhone,
        qrCode,
      });

      setStep('verify');
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Erro ao registrar');
    }
  };

  // Handle code verification
  const handleVerification = async (data: VerificationForm) => {
    if (!fingerprint || !qrCode || !registrationData) return;

    try {
      await verifyCode.mutateAsync({
        code: data.code,
        customerPhone: registrationData.customerPhone,
        qrCode,
        deviceFingerprint: fingerprint,
      });

      setStep('success');
      
      // Redirect to menu after a brief delay
      setTimeout(() => {
        navigate(`/r/${slug}`);
      }, 2000);
    } catch (error: any) {
      verificationForm.setError('code', {
        message: error.response?.data?.message || 'Código inválido',
      });
    }
  };

  // Resend code
  const handleResendCode = async () => {
    if (!registrationData || !qrCode) return;

    try {
      await requestCode.mutateAsync({
        customerPhone: registrationData.customerPhone,
        qrCode,
      });
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Erro ao reenviar código');
    }
  };

  // Render loading state
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verificando mesa...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-error-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Ops! Algo deu errado
          </h1>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Render inactive table state
  if (step === 'inactive') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Mesa não disponível
          </h1>
          <p className="text-gray-600 mb-2">
            Esta mesa ainda não foi ativada pelo garçom.
          </p>
          <p className="text-gray-500 text-sm">
            Por favor, aguarde ou chame um atendente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Restaurant header */}
        {tableStatus && (
          <div className="text-center mb-8">
            {tableStatus.restaurant.logoUrl ? (
              <img
                src={tableStatus.restaurant.logoUrl}
                alt={tableStatus.restaurant.name}
                className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-lg object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary-500 mx-auto mb-4 shadow-lg flex items-center justify-center">
                <QrCode className="w-10 h-10 text-white" />
              </div>
            )}
            <h1 className="font-heading text-2xl font-bold text-gray-900">
              {tableStatus.restaurant.name}
            </h1>
            <p className="text-gray-600 mt-1">
              Mesa {tableStatus.table.number}
              {tableStatus.table.name && ` - ${tableStatus.table.name}`}
            </p>
          </div>
        )}

        {/* Registration form */}
        {step === 'register' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="font-heading text-lg font-bold text-gray-900 mb-6">
              Identifique-se para continuar
            </h2>

            <form
              onSubmit={registrationForm.handleSubmit(handleRegistration)}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Seu nome
                </label>
                <input
                  type="text"
                  {...registrationForm.register('customerName')}
                  className="input"
                  placeholder="Como podemos te chamar?"
                />
                {registrationForm.formState.errors.customerName && (
                  <p className="mt-1 text-sm text-error-500">
                    {registrationForm.formState.errors.customerName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Seu telefone
                </label>
                <input
                  type="tel"
                  {...registrationForm.register('customerPhone')}
                  className="input"
                  placeholder="11999999999"
                  maxLength={11}
                />
                {registrationForm.formState.errors.customerPhone && (
                  <p className="mt-1 text-sm text-error-500">
                    {registrationForm.formState.errors.customerPhone.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Enviaremos um código de verificação
                </p>
              </div>

              {errorMessage && (
                <p className="text-sm text-error-500">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={createSession.isPending || requestCode.isPending}
                className="btn-primary w-full py-3"
              >
                {createSession.isPending || requestCode.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Verification form */}
        {step === 'verify' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="font-heading text-lg font-bold text-gray-900 mb-2">
              Digite o código
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Enviamos um código de 6 dígitos para seu telefone
            </p>

            <form
              onSubmit={verificationForm.handleSubmit(handleVerification)}
              className="space-y-4"
            >
              <div>
                <input
                  type="text"
                  {...verificationForm.register('code')}
                  className="input text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
                {verificationForm.formState.errors.code && (
                  <p className="mt-1 text-sm text-error-500 text-center">
                    {verificationForm.formState.errors.code.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={verifyCode.isPending}
                className="btn-primary w-full py-3"
              >
                {verifyCode.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Verificar'
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={requestCode.isPending}
                  className="text-sm text-primary-600 hover:underline"
                >
                  {requestCode.isPending ? 'Reenviando...' : 'Reenviar código'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Success state */}
        {step === 'success' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
            >
              <CheckCircle className="w-20 h-20 text-success-500 mx-auto mb-4" />
            </motion.div>
            <h2 className="font-heading text-xl font-bold text-gray-900 mb-2">
              Verificado!
            </h2>
            <p className="text-gray-600">
              Redirecionando para o cardápio...
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

