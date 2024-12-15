'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';

export default function CoursePage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subjects: [''] // Start with one empty subject field
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const data = await response.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch courses');
      setCourses([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const addSubjectField = () => {
    setFormData(prev => ({
      ...prev,
      subjects: [...prev.subjects, '']
    }));
  };

  const removeSubjectField = (index: number) => {
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
    
    // Filter out empty subjects
    const filteredSubjects = formData.subjects.filter(subject => subject.trim() !== '');
    
    try {
      const response = await fetch('/api/courses', {
        method: editingCourse ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          subjects: filteredSubjects,
          id: editingCourse?.id
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save course');
      }

      toast.success(editingCourse ? 'Course updated successfully' : 'Course created successfully');
      setFormData({
        name: '',
        description: '',
        subjects: ['']
      });
      setShowModal(false);
      setEditingCourse(null);
      fetchCourses();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (course: any) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      description: course.description || '',
      subjects: course.subjects.length > 0 ? course.subjects : ['']
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this course?')) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete course');
      }

      toast.success('Course deleted successfully');
      fetchCourses();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              setEditingCourse(null);
              setFormData({
                name: '',
                description: '',
                subjects: ['']
              });
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredCourses.map(course => (
          <div key={course.id} className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 mr-4">
                <h3 className="font-semibold text-lg break-words">{course.name}</h3>
              </div>
              <div className="flex space-x-2 flex-shrink-0">
                <button
                  onClick={() => handleEdit(course)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <Edit2 className="h-4 w-4 text-blue-500" />
                </button>
                <button
                  onClick={() => handleDelete(course.id)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
            {course.description && (
              <p className="text-sm text-gray-600 mb-4 break-words">{course.description}</p>
            )}
            {course.subjects.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Subjects:</p>
                <div className="flex flex-wrap gap-2">
                  {course.subjects.map((subject: string, index: number) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded break-words"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredCourses.length === 0 && (
          <p className="text-center text-gray-500 col-span-1 sm:col-span-2 lg:col-span-3">
            No courses found
          </p>
        )}
      </div>

      {/* Course Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingCourse ? 'Edit Course' : 'Add New Course'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter course name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter course description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subjects
                </label>
                <div className="space-y-2">
                  {formData.subjects.map((subject, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => handleSubjectChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter subject name"
                      />
                      {formData.subjects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubjectField(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addSubjectField}
                  className="mt-2 text-blue-500 text-sm hover:text-blue-600 transition-colors"
                >
                  + Add another subject
                </button>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
