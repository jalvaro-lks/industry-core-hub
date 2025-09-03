export interface AxiosError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}