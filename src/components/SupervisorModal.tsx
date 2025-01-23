'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { TextInput, Select, SelectItem, Button } from '@tremor/react';
import { X, UserPlus, School } from 'lucide-react';
import toast from 'react-hot-toast';

interface Course {
  id: string;
  name: string;
  code: string;
}

interface SupervisorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupervisorModal({ isOpen, onClose }: SupervisorModalProps) {
  const [name, setName] = useState('');
  const [courseId, setCourseId] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      const data = await response.json();
      if (response.ok) {
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !courseId) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/supervisors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          courseId,
        }),
      });

      if (response.ok) {
        toast.success('Supervisor added successfully');
        onClose();
        setName('');
        setCourseId('');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to add supervisor');
      }
    } catch (error) {
      console.error('Error adding supervisor:', error);
      toast.error('Failed to add supervisor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <UserPlus className="h-6 w-6 text-blue-600" />
                </div>
                <Dialog.Title className="text-2xl font-semibold text-gray-900">
                  Add Supervisor
                </Dialog.Title>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors rounded-xl p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Supervisor Name
                </label>
                <div className="relative">
                  <TextInput
                    id="name"
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    icon={UserPlus}
                    className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Enter the full name of the supervisor
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="course" className="block text-sm font-medium text-gray-700">
                  Assigned Course
                </label>
                <div className="relative">
                  <Select
                    id="course"
                    placeholder="Select a course"
                    value={courseId}
                    onValueChange={setCourseId}
                    icon={School}
                    className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  >
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id} className="py-2.5">
                        <div className="flex items-center space-x-2">
                          <School className="h-4 w-4 text-gray-500" />
                          <span>{course.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Choose the course this supervisor will oversee
                </p>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 mt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="w-full sm:w-auto rounded-xl px-6 py-2.5 text-sm font-medium border-2 border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full sm:w-auto rounded-xl px-6 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                >
                  Add Supervisor
                </Button>
              </div>
            </form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
