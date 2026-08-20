import { QueryClientProvider } from './providers/QueryClientProvider';
import { AppRouter } from './router/router';

export function App() {
  return (
    <QueryClientProvider>
      <AppRouter />
    </QueryClientProvider>
  );
}
