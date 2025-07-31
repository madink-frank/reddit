// Example component demonstrating the use of installed dependencies
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { create } from 'zustand';

// Example Zustand store
interface ExampleStore {
  count: number;
  increment: () => void;
  decrement: () => void;
}

const useExampleStore = create<ExampleStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));

// Example component using React Query
export const ExampleComponent = () => {
  const { count, increment, decrement } = useExampleStore();
  
  // Example React Query usage
  const { data, isLoading, error } = useQuery({
    queryKey: ['example'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { message: 'Hello from React Query!' };
    },
  });

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error occurred</div>;

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Example Component</h2>
      
      {/* Zustand state management */}
      <div className="mb-4">
        <p className="text-lg mb-2">Count: {count}</p>
        <div className="space-x-2">
          <button 
            onClick={increment}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Increment
          </button>
          <button 
            onClick={decrement}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Decrement
          </button>
        </div>
      </div>

      {/* React Query data */}
      <div className="mb-4">
        <p className="text-green-600">{data?.message}</p>
      </div>

      {/* React Router Link */}
      <Link 
        to="/about" 
        className="text-blue-500 hover:text-blue-700 underline"
      >
        Go to About Page
      </Link>
    </div>
  );
};