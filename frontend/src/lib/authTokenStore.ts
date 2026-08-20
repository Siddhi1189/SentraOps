let inMemoryToken: string | null = null;

export const getAccessToken = (): string | null => {
  return inMemoryToken;
};

export const setAccessToken = (token: string | null): void => {
  inMemoryToken = token;
};

export const clearAccessToken = (): void => {
  inMemoryToken = null;
};
