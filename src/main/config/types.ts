import { NextApiRequest } from "next";
import { NextRequest } from "next/server";

export type HardConfig = {
  apis: {
    // apis
    create: string;
    poll: string;
    callback: string;
    token: string;

    // pages
    signIn: string;

    // misc
    image: string;
    qr: string;
  };
  ids: {
    wrapper: string;
    title: string;
    qr: string;
    copy: string;
    button: string;
    loading: string;
  };
  intervals: {
    refreshToken: number;
    idToken: number;
    poll: number;
    create: number;
  };
};

export type LnAuthData = {
  k1: string;
  state: string;

  pubkey?: string | null;
  sig?: string | null;
  success?: boolean | null;

  // allow any other fields, they'll be ignored
  [key: string | number | symbol]: unknown;
};

export type QRGenerator = (
  data: string,
  config: Config
) => Promise<{ data: string; type: "svg" | "png" | "jpg" }>;
export type AvatarGenerator = (
  seed: string,
  config: Config
) => Promise<{ data: string; type: "svg" | "png" | "jpg" }>;
export type NameGenerator = (
  seed: string,
  config: Config
) => Promise<{ name: string }>;

export type RequiredConfig = {
  siteUrl: string;
  secret: string;
  storage: {
    set: (
      args: {
        k1: string;
        data: {
          k1: string;
          state: string;
        };
      },
      req: NextApiRequest | NextRequest
    ) => Promise<undefined>;
    get: (
      args: { k1: string },
      req: NextApiRequest | NextRequest
    ) => Promise<LnAuthData>;
    update: (
      args: {
        k1: string;
        data: {
          pubkey: string;
          sig: string;
          success: boolean;
        };
      },
      req: NextApiRequest | NextRequest
    ) => Promise<undefined>;
    delete: (
      args: { k1: string },
      req: NextApiRequest | NextRequest
    ) => Promise<undefined>;
  };
  generateQr: QRGenerator;
};

export type ThemeStyles = {
  background: string;
  backgroundCard: string;
  text: string;
  qrBackground: string;
  qrForeground: string;
  qrMargin: number;
  loginButtonBackground: string;
  loginButtonText: string;
};

export type OptionalConfig = {
  pages: {
    signIn?: string;
    error?: string;
  };
  title: string | null;
  generateAvatar: AvatarGenerator | null;
  generateName: NameGenerator | null;

  theme: {
    colorScheme?: "dark" | "light";
  } & Partial<ThemeStyles>;
};

export type UserConfig = RequiredConfig & Partial<OptionalConfig>;

export type Config = HardConfig &
  RequiredConfig &
  OptionalConfig & { theme: ThemeStyles };
