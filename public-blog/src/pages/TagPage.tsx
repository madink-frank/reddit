import React from 'react';
import { useParams } from 'react-router-dom';

const TagPage: React.FC = () => {
  const { tagSlug } = useParams<{ tagSlug: string }>();

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">
          Tag: {tagSlug}
        </h1>
        
        <p className="text-gray-600 mb-6">
          Posts tagged with "{tagSlug}" will be displayed here.
        </p>
        
        <div className="text-center text-gray-500 py-12">
          Tag filtering will be implemented in future tasks.
        </div>
      </div>
    </div>
  );
};

export default TagPage;