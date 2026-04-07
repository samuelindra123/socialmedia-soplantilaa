export enum EmailType {
  WELCOME = 'WELCOME',
  OTP_VERIFICATION = 'OTP_VERIFICATION',
  LOGIN_NEW_DEVICE = 'LOGIN_NEW_DEVICE',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
}

export enum EmailStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
}

export const EMAIL_SUBJECTS: Record<EmailType, string> = {
  [EmailType.WELCOME]: 'Selamat datang di Soplantila! 🌱',
  [EmailType.OTP_VERIFICATION]: 'Kode verifikasi Soplantila kamu',
  [EmailType.LOGIN_NEW_DEVICE]:
    'Login baru terdeteksi dari perangkat tidak dikenal',
  [EmailType.PASSWORD_CHANGED]: 'Password kamu berhasil diubah',
  [EmailType.PASSWORD_RESET]: 'Reset password akun Soplantila',
  [EmailType.ACCOUNT_LOCKED]: 'Akun kamu dikunci sementara',
  [EmailType.ACCOUNT_UNLOCKED]: 'Akun kamu sudah aktif kembali',
};

export const EMAIL_QUEUE_NAME = 'email-queue';
