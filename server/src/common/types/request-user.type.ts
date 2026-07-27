export type RequestUser = {
  id: string;
  email: string;
  isBlocked: boolean;
  isAuthorized: boolean;
  roles: string[];
};
