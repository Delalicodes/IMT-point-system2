'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  description: string;
  subjects: { id: string; name: string }[];
}

export default function CoursePage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subjects: ['']
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (!response.ok) throw new Error('Failed to fetch courses');
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch courses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      const response = await fetch(`/api/courses?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete course');

      toast.success('Course deleted successfully');
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

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

  const handleEditClick = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      name: course.name,
      description: course.description || '',
      subjects: course.subjects.map(s => s.name)
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      subjects: ['']
    });
    setSelectedCourse(null);
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const filteredSubjects = formData.subjects.filter(subject => subject.trim() !== '');
      
      const response = await fetch('/api/courses', {
        method: selectedCourse ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(selectedCourse && { id: selectedCourse.id }),
          name: formData.name,
          description: formData.description,
          subjects: filteredSubjects,
        }),
      });

      if (!response.ok) throw new Error(`Failed to ${selectedCourse ? 'update' : 'create'} course`);

      toast.success(`Course ${selectedCourse ? 'updated' : 'created'} successfully`);
      resetForm();
      fetchCourses();
    } catch (error) {
      console.error(`Error ${selectedCourse ? 'updating' : 'creating'} course:`, error);
      toast.error(`Failed to ${selectedCourse ? 'update' : 'create'} course`);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Course Management</h1>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-600"
          >
            <Plus className="h-5 w-5" />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses.map(course => (
          <div key={course.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 mr-4">
                <h3 className="font-semibold text-lg">{course.name}</h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditClick(course)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Edit2 className="h-4 w-4 text-blue-500" />
                </button>
                <button
                  onClick={() => handleDelete(course.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
            {course.description && (
              <p className="text-sm text-gray-600 mb-4">{course.description}</p>
            )}
            {course.subjects.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Subjects:</p>
                <div className="flex flex-wrap gap-2">
                  {course.subjects.map((subject) => (
                    <span
                      key={subject.id}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                    >
                      {subject.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredCourses.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No courses found</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Add your first course
            </button>
          </div>
        )}
      </div>

      {/* Course Modal (Add/Edit) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">
                {selectedCourse ? 'Edit Course' : 'Add New Course'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Subjects
                    </label>
                    <button
                      type="button"
                      onClick={handleAddSubject}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add Subject
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.subjects.map((subject, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => handleSubjectChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter subject name"
                        />
                        {formData.subjects.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(index)}
                            className="text-red-500 hover:text-red-700 px-2"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  {selectedCourse ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
