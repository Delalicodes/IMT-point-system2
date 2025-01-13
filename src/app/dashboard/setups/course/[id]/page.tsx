'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface Course {
  id: string;
  name: string;
  description: string;
  subjects: { id: string; name: string }[];
}

export default function EditCoursePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subjects: ['']
  });

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/courses/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch course');
        const course = await response.json();
        
        setFormData({
          name: course.name,
          description: course.description || '',
          subjects: course.subjects.length > 0 
            ? course.subjects.map((s: { name: string }) => s.name)
            : ['']
        });
      } catch (error) {
        console.error('Error fetching course:', error);
        toast.error('Failed to fetch course details');
        router.push('/dashboard/setups/course');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [params.id, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubjectChange = (index: number, value: string) => {
    const newSubjects = [...formData.subjects];
    newSubjects[index] = value;
    setFormData(prev => ({
      ...prev,
      subjects: newSubjects
    }));
  };

  const handleAddSubject = () => {
    setFormData(prev => ({
      ...prev,
      subjects: [...prev.subjects, '']
    }));
  };

  const handleRemoveSubject = (index: number) => {
    if (formData.subjects.length > 1) {
      const newSubjects = formData.subjects.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        subjects: newSubjects
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const filteredSubjects = formData.subjects.filter(subject => subject.trim() !== '');
      
      const response = await fetch('/api/courses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: params.id,
          name: formData.name,
          description: formData.description,
          subjects: filteredSubjects,
        }),
      });

      if (!response.ok) throw new Error('Failed to update course');

      toast.success('Course updated successfully');
      router.push('/dashboard/setups/course');
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">Edit Course</h1>
        <button
          onClick={() => router.push('/dashboard/setups/course')}
          className="text-gray-600 hover:text-gray-800 transition-colors"
        >
          Back to Courses
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter course name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter course description"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Subjects
              </label>
              <button
                type="button"
                onClick={handleAddSubject}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                + Add Subject
              </button>
            </div>
            <div className="space-y-3">
              {formData.subjects.map((subject, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => handleSubjectChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter subject name"
                  />
                  {formData.subjects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(index)}
                      className="px-3 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard/setups/course')}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Updating...' : 'Update Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
