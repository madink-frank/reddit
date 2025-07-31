import React from 'react';
import { useParams } from 'react-router-dom';

const CategoryPage: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">
          Category: {categorySlug}
        </h1>
        
        <p className="text-gray-600 mb-6">
          Posts in the "{categorySlug}" category will be displayed here.
        </p>
        
        <div className="text-center text-gray-500 py-12">
          Category filtering will be implemented in future tasks.
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;