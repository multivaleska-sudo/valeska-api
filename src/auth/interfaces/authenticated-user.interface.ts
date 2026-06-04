export interface AuthenticatedUser {
  sub: string;
  username: string;
  rol: string;
  nombreCompleto?: string;
}
