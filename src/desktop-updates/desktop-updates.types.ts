export interface DesktopUpdateRelease {
  version: string;
  target: string;
  arch: string;
  fileName: string;
  signature: string;
  notes?: string;
  pubDate?: string;
  enabled?: boolean;
}

export interface DesktopUpdatesManifest {
  releases: DesktopUpdateRelease[];
}

export interface TauriUpdateManifest {
  version: string;
  notes: string;
  pub_date: string;
  url: string;
  signature: string;
}