export enum GpgErrorCode {
  GPG_NOT_FOUND = "GPG_NOT_FOUND",
  RECIPIENT_KEY_NOT_FOUND = "RECIPIENT_KEY_NOT_FOUND",
  RECIPIENT_KEY_REVOKED = "RECIPIENT_KEY_REVOKED",
  RECIPIENT_KEY_EXPIRED = "RECIPIENT_KEY_EXPIRED",
  RECIPIENT_KEY_UNTRUSTED = "RECIPIENT_KEY_UNTRUSTED",
  RECIPIENT_KEY_DISABLED = "RECIPIENT_KEY_DISABLED",
  RECIPIENT_KEY_UNKNOWN = "RECIPIENT_KEY_UNKNOWN",

  SIGNER_KEY_NOT_FOUND = "SIGNER_KEY_NOT_FOUND",
  SIGNER_NO_SECRET_KEY = "SIGNER_NO_SECRET_KEY",
  SIGNER_KEY_UNTRUSTED = "SIGNER_KEY_UNTRUSTED",

  PINENTRY_CANCELLED = 'PINENTRY_CANCELLED',
  BAD_PASSPHRASE = 'BAD_PASSPHRASE',

  GENERAL_GPG_ERROR = 'GENERAL_GPG_ERROR',
}

type GpgErrorDetail = { code: GpgErrorCode, regex: RegExp | RegExp[]; message: string; }
export const GpgErrorMap: Record<GpgErrorCode, GpgErrorDetail> = {

  [GpgErrorCode.SIGNER_KEY_NOT_FOUND]: {
    code: GpgErrorCode.SIGNER_KEY_NOT_FOUND,
    message: "The specified secret key was not found in the local secret keyring.",
    regex: /\[GNUPG:\]\s+INV_SGNR\s+1\s+/i,
  },
  [GpgErrorCode.SIGNER_NO_SECRET_KEY]: {
    code: GpgErrorCode.SIGNER_NO_SECRET_KEY,
    message: "No secret key is available for the specified fingerprint.",
    regex: /\[GNUPG:\]\s+INV_SGNR\s+9\s+/i,
  },
  [GpgErrorCode.SIGNER_KEY_UNTRUSTED]: {
    code: GpgErrorCode.SIGNER_KEY_UNTRUSTED,
    message: "The key is not trusted under the current GPG configuration.",
    regex: /\[GNUPG:\]\s+INV_SGNR\s+10\s+/i,
  },

  [GpgErrorCode.RECIPIENT_KEY_NOT_FOUND]: {
    code: GpgErrorCode.RECIPIENT_KEY_NOT_FOUND,
    message: "Recipient public key is missing from the local keyring.",
    regex: /\[GNUPG:\]\s+INV_RECP\s+1\s+/i,
  },
  [GpgErrorCode.RECIPIENT_KEY_REVOKED]: {
    code: GpgErrorCode.RECIPIENT_KEY_REVOKED,
    message: "The recipient's public key has been revoked and cannot be used for encryption.",
    regex: /\[GNUPG:\]\s+KEYREVOKED\s+4\s+/i,
  },
  [GpgErrorCode.RECIPIENT_KEY_EXPIRED]: {
    code: GpgErrorCode.RECIPIENT_KEY_EXPIRED,
    message: "The recipient's public key has expired.",
    regex: /\[GNUPG:\]\s+KEYEXPIRED\s+/i,
  },
  [GpgErrorCode.RECIPIENT_KEY_UNTRUSTED]: {
    code: GpgErrorCode.RECIPIENT_KEY_UNTRUSTED,
    message: "Recipient key is present but not trusted under current GPG trust settings.",
    regex: /\[GNUPG:\]\s+INV_RECP\s+10\s+/i,
  },
  [GpgErrorCode.RECIPIENT_KEY_DISABLED]: {
    code: GpgErrorCode.RECIPIENT_KEY_DISABLED,
    message: "The recipient's public key has been manually disabled in the keyring.",
    regex: /\[GNUPG:\]\s+INV_RECP\s+13\s+/i,
  },
  [GpgErrorCode.RECIPIENT_KEY_UNKNOWN]: {
    code: GpgErrorCode.RECIPIENT_KEY_UNKNOWN,
    message: "General Error: The recipient key is unknown.",
    regex: /\[GNUPG:\]\s+INV_RECP\s+0\s+/i,
  },

  [GpgErrorCode.PINENTRY_CANCELLED]: {
    code: GpgErrorCode.PINENTRY_CANCELLED,
    regex: /gpg:\s+.*Operation\sCancelled/i,
    message: 'The passphrase entry was cancelled by the user.'
  },
  [GpgErrorCode.BAD_PASSPHRASE]: {
    code: GpgErrorCode.BAD_PASSPHRASE,
    regex: /gpg:\s+.*Bad\spassphrase/i,
    message: 'The provided passphrase is incorrect.'
  },

  [GpgErrorCode.GENERAL_GPG_ERROR]: {
    code: GpgErrorCode.GENERAL_GPG_ERROR,
    regex: /\[GNUPG:\]\s+FAILURE/i,
    message: 'An unexpected GPG error occurred.'
  },

  [GpgErrorCode.GPG_NOT_FOUND]: {
    code: GpgErrorCode.GPG_NOT_FOUND,
    regex: /gpg:\s+.*not found/i, // TODO: this probably won't work
    message: 'The GPG binary was not found or is not executable.'
  },
}

export function identifyError(stderrRaw: string): GpgErrorDetail {
  const stderr = normalizeStderr(stderrRaw);

  for (const [_, errorDetail] of Object.entries(GpgErrorMap)) {
    if (Array.isArray(errorDetail.regex)) {
      if (errorDetail.regex.some(rx => rx.test(stderr))) return errorDetail;
    } else if (errorDetail.regex.test(stderr)) {
      return errorDetail;
    }
  }
  return GpgErrorMap[GpgErrorCode.GENERAL_GPG_ERROR];
}

function normalizeStderr(stderr: string): string {
  return (stderr || '').replace(/\r\n/g, '\n');
}
