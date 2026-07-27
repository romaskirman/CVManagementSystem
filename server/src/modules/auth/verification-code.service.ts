import crypto from 'crypto';
import { Resend } from 'resend';
import { AuthError } from '../../common/errors/AuthError';
import { env } from '../../config/env';

const VERIFICATION_CODE_TTL_MINUTES = 15;

type ResendTarget = {
  index: number;
  apiKey: string;
  to: string;
};

function maskApiKey(apiKey: string): string {
  if (!apiKey) return 'empty';
  if (apiKey.length <= 12) return apiKey;
  return `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`;
}

export class VerificationCodeService {
  private readonly resendTargets: ResendTarget[];
  private readonly fromEmail: string | null;

  constructor() {
    this.resendTargets = env.RESEND_TARGETS.map((target) => ({
      ...target,
      to: target.to.trim().toLowerCase()
    }));
    this.fromEmail = env.RESEND_FROM || null;

    console.log('[VerificationCodeService.constructor] initialized', {
      hasFromEmail: Boolean(this.fromEmail),
      fromEmail: this.fromEmail,
      targetsCount: this.resendTargets.length,
      targets: this.resendTargets.map((target) => ({
        index: target.index,
        to: target.to,
        apiKeyMasked: maskApiKey(target.apiKey)
      }))
    });
  }

  generateCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  hashCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  getExpiresAt(): Date {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + VERIFICATION_CODE_TTL_MINUTES);
    return expiresAt;
  }

  verifyCode(rawCode: string, codeHash: string): boolean {
    return this.hashCode(rawCode) === codeHash;
  }

  async sendVerificationCode(params: { email: string; code: string }): Promise<void> {
    const normalizedEmail = params.email.trim().toLowerCase();

    console.log('[VerificationCodeService.sendVerificationCode] start', {
      requestedEmail: normalizedEmail,
      codePreview: `${params.code.slice(0, 2)}****`,
      fromEmail: this.fromEmail,
      targetsCount: this.resendTargets.length
    });

    if (!this.fromEmail || this.resendTargets.length === 0) {
      console.error('[VerificationCodeService.sendVerificationCode] email delivery not configured', {
        hasFromEmail: Boolean(this.fromEmail),
        targetsCount: this.resendTargets.length
      });
      throw new AuthError('Email delivery is not configured');
    }

    const matchedTarget = this.resendTargets.find((target) => target.to === normalizedEmail);

    if (!matchedTarget) {
      console.error('[VerificationCodeService.sendVerificationCode] no target matched requested email', {
        requestedEmail: normalizedEmail,
        availableTargets: this.resendTargets.map((target) => ({
          index: target.index,
          to: target.to
        }))
      });

      throw new AuthError(
        `No Resend target configured for email ${normalizedEmail}`
      );
    }

    console.log('[VerificationCodeService.sendVerificationCode] matched target', {
      requestedEmail: normalizedEmail,
      targetIndex: matchedTarget.index,
      targetTo: matchedTarget.to,
      apiKeyMasked: maskApiKey(matchedTarget.apiKey)
    });

    try {
      const resend = new Resend(matchedTarget.apiKey);

      const response = await resend.emails.send({
        from: this.fromEmail,
        to: [matchedTarget.to],
        subject: 'Your verification code',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>Email verification</h2>
            <p>Requested email:</p>
            <p><strong>${normalizedEmail}</strong></p>
            <p>Your verification code is:</p>
            <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${params.code}</p>
            <p>This code will expire in 15 minutes.</p>
            <p>Delivery target index: ${matchedTarget.index}</p>
            <p>Delivery mailbox: ${matchedTarget.to}</p>
          </div>
        `
      });

      console.log('[VerificationCodeService.sendVerificationCode] resend response received', {
        targetIndex: matchedTarget.index,
        targetTo: matchedTarget.to,
        response
      });

      const responseData =
        response && typeof response === 'object' && 'data' in response ? response.data : null;
      const responseError =
        response && typeof response === 'object' && 'error' in response ? response.error : null;

      if (responseError) {
        const errorMessage =
          typeof responseError === 'object' && responseError && 'message' in responseError
            ? String(responseError.message)
            : JSON.stringify(responseError);

        console.error('[VerificationCodeService.sendVerificationCode] resend returned error', {
          targetIndex: matchedTarget.index,
          targetTo: matchedTarget.to,
          errorMessage
        });

        throw new AuthError(errorMessage);
      }

      const messageId =
        responseData &&
        typeof responseData === 'object' &&
        'id' in responseData &&
        responseData.id
          ? String(responseData.id)
          : null;

      if (!messageId) {
        console.error('[VerificationCodeService.sendVerificationCode] missing message id', {
          targetIndex: matchedTarget.index,
          targetTo: matchedTarget.to,
          response
        });

        throw new AuthError('Resend response did not include a message id');
      }

      console.log('[VerificationCodeService.sendVerificationCode] success', {
        targetIndex: matchedTarget.index,
        targetTo: matchedTarget.to,
        messageId
      });
    } catch (error) {
      console.error('[VerificationCodeService.sendVerificationCode] failed with exception', {
        requestedEmail: normalizedEmail,
        targetIndex: matchedTarget.index,
        targetTo: matchedTarget.to,
        message: error instanceof Error ? error.message : error
      });

      throw error;
    }
  }
}
