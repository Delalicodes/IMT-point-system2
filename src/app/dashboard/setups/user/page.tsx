'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Tab, TabList, TabGroup, TabPanel, TabPanels, TextInput, Select, SelectItem, Badge, Button } from '@tremor/react';
import { X, User, Settings, Phone, BookOpen, Search, Filter, Users, UserPlus, Lock, MoreVertical, Edit2, Trash2, UserCheck, UserX } from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber: string;
  role: string;
  courseId?: string;
  supervisorId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Course {
  id: string;
  name: string;
  description?: string;
  subjects: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber: string;
  courseId?: string;
  supervisorId?: string;
  password: string;
  confirmPassword: string;
  role: string;
}

function UserSetupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = parseInt(searchParams.get('tab') || '0');
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    // Update URL without refreshing the page
    const url = new URL(window.location.href);
    url.searchParams.set('tab', index.toString());
    window.history.pushState({}, '', url.toString());
  };

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phoneNumber: '',
    courseId: '',
    supervisorId: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [isLoadingSupervisors, setIsLoadingSupervisors] = useState(true);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          courseId: formData.courseId,
          supervisorId: formData.supervisorId,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Add the new user to the users list
      setUsers(prevUsers => [data, ...prevUsers]);

      toast.success('User created successfully');
      setFormData({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phoneNumber: '',
        courseId: '',
        supervisorId: '',
        password: '',
        confirmPassword: '',
        role: 'STUDENT',
      });

      // Switch to manage users tab
      handleTabChange(1);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast.error('Failed to fetch users');
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoadingCourses(true);
      try {
        const response = await fetch('/api/courses');
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }
        const data = await response.json();
        setCourses(data);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
        toast.error('Failed to fetch courses');
      } finally {
        setIsLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  // Fetch supervisors
  useEffect(() => {
    const fetchSupervisors = async () => {
      setIsLoadingSupervisors(true);
      try {
        const response = await fetch('/api/supervisors');
        if (!response.ok) {
          throw new Error('Failed to fetch supervisors');
        }
        const data = await response.json();
        console.log('Fetched supervisors:', data); // Debug log
        const filteredSupervisors = data.filter((user: User) => user.role === 'SUPERVISOR');
        console.log('Filtered supervisors:', filteredSupervisors); // Debug log
        setSupervisors(filteredSupervisors);
      } catch (error) {
        console.error('Failed to fetch supervisors:', error);
        toast.error('Failed to fetch supervisors');
      } finally {
        setIsLoadingSupervisors(false);
      }
    };
    fetchSupervisors();
  }, []);

  // Delete selected users
  const handleDeleteSelected = async () => {
    if (!selectedUsers.length) return;
    
    if (!confirm('Are you sure you want to delete the selected users?')) return;

    try {
      const response = await fetch('/api/users/delete-multiple', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds: selectedUsers }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete users');
      }

      setUsers(users.filter(user => !selectedUsers.includes(user.id)));
      setSelectedUsers([]);
      toast.success('Users deleted successfully');
    } catch (error) {
      toast.error('Failed to delete users');
    }
  };

  // Change role for selected users
  const handleChangeRole = async () => {
    if (!selectedUsers.length || !selectedRole) return;

    try {
      const response = await fetch('/api/users/change-role', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userIds: selectedUsers,
          role: selectedRole 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user roles');
      }

      setUsers(users.map(user => 
        selectedUsers.includes(user.id) 
          ? { ...user, role: selectedRole }
          : user
      ));
      setSelectedUsers([]);
      toast.success('User roles updated successfully');
    } catch (error) {
      toast.error('Failed to update user roles');
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Handle single user delete
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      setUsers(users.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  // Handle edit user
  const handleEditUser = async (values: any) => {
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      const updatedUser = await response.json();
      setUsers(users.map(user => 
        user.id === editingUser.id ? updatedUser : user
      ));
      setShowEditModal(false);
      setEditingUser(null);
      setFormData({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phoneNumber: '',
        courseId: '',
        supervisorId: '',
        password: '',
        confirmPassword: '',
        role: 'STUDENT',
      });
      toast.success('User updated successfully');
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  // Set form data when editing user
  useEffect(() => {
    if (editingUser) {
      setFormData({
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        username: editingUser.username,
        email: editingUser.email,
        phoneNumber: editingUser.phoneNumber,
        courseId: editingUser.courseId || '',
        supervisorId: editingUser.supervisorId || '',
        password: '',
        confirmPassword: '',
        role: editingUser.role,
      });
    }
  }, [editingUser]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setRoleFilter('all');
  };

  return (
    <div className="min-h-screen bg-white w-full">
      <div className="max-w-7xl mx-auto py-6">
        <div className="bg-white w-full">
          <TabGroup index={activeTab} onIndexChange={handleTabChange}>
            <div className="border-b border-gray-100">
              <TabList className="flex">
                <Tab 
                  className={`relative flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-all duration-200 ${
                    activeTab === 0 
                    ? 'text-indigo-600 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-gradient-to-r after:from-indigo-400 after:to-indigo-600 after:rounded-full' 
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => handleTabChange(0)}
                >
                  <UserPlus className={`w-4 h-4 ${activeTab === 0 ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <span>Create User</span>
                </Tab>
                <Tab 
                  className={`relative flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-all duration-200 ${
                    activeTab === 1 
                    ? 'text-indigo-600 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-gradient-to-r after:from-indigo-400 after:to-indigo-600 after:rounded-full' 
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => handleTabChange(1)}
                >
                  <Users className={`w-4 h-4 ${activeTab === 1 ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <span>Manage Users</span>
                </Tab>
                <Tab 
                  className={`relative flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-all duration-200 ${
                    activeTab === 2 
                    ? 'text-indigo-600 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-gradient-to-r after:from-indigo-400 after:to-indigo-600 after:rounded-full' 
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => handleTabChange(2)}
                >
                  <Lock className={`w-4 h-4 ${activeTab === 2 ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <span>Permissions</span>
                </Tab>
              </TabList>
            </div>
            <TabPanels>
              <TabPanel>
                <div className="p-6">
                  <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
                    {/* Account Information Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <div className="flex items-center space-x-2 mb-6">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                          <UserPlus className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
                          <p className="text-sm text-gray-500">Basic user information</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                            First Name
                          </label>
                          <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                            placeholder="Enter first name"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                            Last Name
                          </label>
                          <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                            placeholder="Enter last name"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Login Credentials Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <div className="flex items-center space-x-2 mb-6">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                          <Lock className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Login Credentials</h3>
                          <p className="text-sm text-gray-500">User authentication details</p>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                              Username
                            </label>
                            <input
                              type="text"
                              id="username"
                              name="username"
                              value={formData.username}
                              onChange={handleChange}
                              required
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                              placeholder="Choose a username"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                              Role
                            </label>
                            <select
                              id="role"
                              name="role"
                              value={formData.role}
                              onChange={handleChange}
                              required
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                            >
                              <option value="STUDENT">Student</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                              Password
                            </label>
                            <input
                              type="password"
                              id="password"
                              name="password"
                              value={formData.password}
                              onChange={handleChange}
                              required
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                              placeholder="Enter password"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                              Confirm Password
                            </label>
                            <input
                              type="password"
                              id="confirmPassword"
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              required
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                              placeholder="Confirm password"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Student Details Section (Conditional) */}
                    {formData.role === 'STUDENT' && (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center space-x-2 mb-6">
                          <div className="p-2 bg-indigo-50 rounded-lg">
                            <Users className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Student Details</h3>
                            <p className="text-sm text-gray-500">Additional information for students</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                              Email Address
                            </label>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              required
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                              placeholder="Enter email address"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              id="phoneNumber"
                              name="phoneNumber"
                              value={formData.phoneNumber}
                              onChange={handleChange}
                              required
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                              placeholder="Enter phone number"
                            />
                          </div>
                          <div className="space-y-1.5 md:col-span-2">
                            <label htmlFor="courseId" className="block text-sm font-medium text-gray-700">
                              Course
                            </label>
                            <select
                              id="courseId"
                              name="courseId"
                              value={formData.courseId}
                              onChange={handleChange}
                              required
                              disabled={isLoadingCourses}
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              <option value="">
                                {isLoadingCourses ? 'Loading courses...' : 'Select a course'}
                              </option>
                              {!isLoadingCourses && courses.map(course => (
                                <option key={course.id} value={course.id}>
                                  {course.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5 md:col-span-2">
                            <label htmlFor="supervisorId" className="block text-sm font-medium text-gray-700">
                              Supervisor
                            </label>
                            <select
                              id="supervisorId"
                              name="supervisorId"
                              value={formData.supervisorId}
                              onChange={handleChange}
                              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              required
                              disabled={isLoadingSupervisors}
                            >
                              <option value="">
                                {isLoadingSupervisors ? 'Loading supervisors...' : 'Select a supervisor'}
                              </option>
                              {!isLoadingSupervisors && supervisors.map((supervisor) => (
                                <option 
                                  key={supervisor.id} 
                                  value={supervisor.id}
                                >
                                  {supervisor.firstName} {supervisor.lastName}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 flex items-center space-x-2 ${
                          isLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                            <span>Creating...</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-5 h-5" />
                            <span>Create User</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </TabPanel>
              <TabPanel>
                <div className="p-6 bg-white">
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">Manage Users</h2>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                      <div className="flex-1">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search users..."
                            className="block w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative min-w-[140px]">
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none w-full bg-gray-50 border border-gray-200 text-gray-900 py-2.5 px-4 pr-8 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                          >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        <div className="relative min-w-[140px]">
                          <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="appearance-none w-full bg-gray-50 border border-gray-200 text-gray-900 py-2.5 px-4 pr-8 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                          >
                            <option value="all">All Roles</option>
                            <option value="ADMIN">Admin</option>
                            <option value="STUDENT">Student</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        <button 
                          className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 text-gray-500 hover:text-gray-700"
                          title="Clear Filters"
                          onClick={clearFilters}
                        >
                          <Filter className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                    {isLoadingUsers ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-500">Loading users...</p>
                      </div>
                    ) : users.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-gray-500">No users found</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedUsers(users.map(user => user.id));
                                    } else {
                                      setSelectedUsers([]);
                                    }
                                  }}
                                />
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {filteredUsers.map((user) => (
                              <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={selectedUsers.includes(user.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedUsers([...selectedUsers, user.id]);
                                      } else {
                                        setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                      }
                                    }}
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="h-10 w-10 flex-shrink-0">
                                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <span className="text-blue-600 font-medium">
                                          {user.firstName[0]}{user.lastName[0]}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">
                                        {user.firstName} {user.lastName}
                                      </div>
                                      <div className="text-sm text-gray-500">{user.username}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {user.role === 'ADMIN' ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                                      Admin
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/20">
                                      Student
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge color="green">Active</Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <div className="flex space-x-2">
                                    <button 
                                      className="p-1 hover:bg-gray-100 rounded-full"
                                      onClick={() => {
                                        setEditingUser(user);
                                        setFormData({
                                          firstName: user.firstName,
                                          lastName: user.lastName,
                                          username: user.username,
                                          email: user.email || '',
                                          phoneNumber: user.phoneNumber || '',
                                          courseId: user.courseId || '',
                                          supervisorId: user.supervisorId || '',
                                          password: '',
                                          confirmPassword: '',
                                          role: user.role,
                                        });
                                        setShowEditModal(true);
                                      }}
                                    >
                                      <Edit2 className="w-4 h-4 text-gray-500" />
                                    </button>
                                    <button 
                                      className="p-1 hover:bg-gray-100 rounded-full"
                                      onClick={() => handleDeleteUser(user.id)}
                                    >
                                      <Trash2 className="w-4 h-4 text-gray-500" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {selectedUsers.length > 0 && (
                    <div className="mt-4 flex justify-end space-x-4">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedUsers([])}
                      >
                        Cancel Selection
                      </Button>
                      <Button
                        size="sm"
                        color="red"
                        onClick={handleDeleteSelected}
                      >
                        Delete Selected
                      </Button>
                      <Button
                        size="sm"
                        color="blue"
                        onClick={() => {
                          setSelectedRole('');
                          setShowRoleModal(true);
                        }}
                      >
                        Change Role
                      </Button>
                    </div>
                  )}

                  {/* Edit User Modal */}
                  {showEditModal && editingUser && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center">
                                <span className="text-indigo-600 font-medium">
                                  {editingUser.firstName[0]}{editingUser.lastName[0]}
                                </span>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">Edit User Profile</h3>
                                <p className="text-sm text-gray-500">{editingUser.username}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setShowEditModal(false);
                                setEditingUser(null);
                                setFormData({
                                  firstName: '',
                                  lastName: '',
                                  username: '',
                                  email: '',
                                  phoneNumber: '',
                                  courseId: '',
                                  supervisorId: '',
                                  password: '',
                                  confirmPassword: '',
                                  role: 'STUDENT',
                                });
                              }}
                              className="text-gray-400 hover:text-gray-500"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                        
                        <form 
                          id="edit-user-form"
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleEditUser(formData);
                          }} 
                          className="p-6 space-y-6"
                        >
                          {/* Personal Information */}
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2 mb-4">
                              <User className="w-5 h-5 text-indigo-600" />
                              <h4 className="text-sm font-medium text-gray-900">Personal Information</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                <input
                                  type="text"
                                  name="firstName"
                                  value={formData.firstName}
                                  onChange={handleChange}
                                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <input
                                  type="text"
                                  name="lastName"
                                  value={formData.lastName}
                                  onChange={handleChange}
                                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                  required
                                />
                              </div>
                            </div>
                          </div>

                          {/* Account Information */}
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2 mb-4">
                              <Settings className="w-5 h-5 text-indigo-600" />
                              <h4 className="text-sm font-medium text-gray-900">Account Information</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input
                                  type="text"
                                  name="username"
                                  value={formData.username}
                                  onChange={handleChange}
                                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                  name="role"
                                  value={formData.role}
                                  onChange={handleChange}
                                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                  required
                                >
                                  <option value="STUDENT">Student</option>
                                  <option value="ADMIN">Admin</option>
                                </select>
                              </div>
                              <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                  type="password"
                                  name="password"
                                  value={formData.password}
                                  onChange={handleChange}
                                  placeholder="Leave blank to keep current password"
                                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Contact Information */}
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2 mb-4">
                              <Phone className="w-5 h-5 text-indigo-600" />
                              <h4 className="text-sm font-medium text-gray-900">Contact Information</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                  type="email"
                                  name="email"
                                  value={formData.email}
                                  onChange={handleChange}
                                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                  type="tel"
                                  name="phoneNumber"
                                  value={formData.phoneNumber}
                                  onChange={handleChange}
                                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                  required
                                />
                              </div>
                            </div>
                          </div>

                          {/* Course Information */}
                          {formData.role === 'STUDENT' && (
                            <div className="space-y-4">
                              <div className="flex items-center space-x-2 mb-4">
                                <BookOpen className="w-5 h-5 text-indigo-600" />
                                <h4 className="text-sm font-medium text-gray-900">Course Information</h4>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                                <select
                                  name="courseId"
                                  value={formData.courseId}
                                  onChange={handleChange}
                                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                  required
                                >
                                  <option value="">Select a course</option>
                                  {courses.map(course => (
                                    <option key={course.id} value={course.id}>{course.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor</label>
                                <select
                                  id="supervisorId"
                                  name="supervisorId"
                                  value={formData.supervisorId}
                                  onChange={handleChange}
                                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                  required
                                  disabled={isLoadingSupervisors}
                                >
                                  <option value="">
                                    {isLoadingSupervisors ? 'Loading supervisors...' : 'Select a supervisor'}
                                  </option>
                                  {!isLoadingSupervisors && supervisors.map((supervisor) => (
                                    <option 
                                      key={supervisor.id} 
                                      value={supervisor.id}
                                    >
                                      {supervisor.firstName} {supervisor.lastName}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </form>

                        {/* Fixed bottom action bar */}
                        <div className="border-t border-gray-100 p-4 bg-gray-50 rounded-b-xl">
                          <div className="flex items-center justify-end space-x-3">
                            <button
                              type="button"
                              onClick={() => {
                                setShowEditModal(false);
                                setEditingUser(null);
                                setFormData({
                                  firstName: '',
                                  lastName: '',
                                  username: '',
                                  email: '',
                                  phoneNumber: '',
                                  courseId: '',
                                  supervisorId: '',
                                  password: '',
                                  confirmPassword: '',
                                  role: 'STUDENT',
                                });
                              }}
                              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              form="edit-user-form"
                              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                              {isLoading ? (
                                <>
                                  <span className="inline-block animate-spin mr-2">⟳</span>
                                  Saving Changes...
                                </>
                              ) : (
                                'Save Changes'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Role Change Modal */}
                  {showRoleModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium mb-4">Change User Role</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Select New Role
                            </label>
                            <select
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg"
                              required
                            >
                              <option value="">Select a role</option>
                              <option value="STUDENT">Student</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </div>
                          <div className="flex justify-end space-x-2 mt-4">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setShowRoleModal(false);
                                setSelectedRole('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              color="blue"
                              onClick={() => {
                                if (selectedRole) {
                                  handleChangeRole();
                                  setShowRoleModal(false);
                                  setSelectedRole('');
                                }
                              }}
                              disabled={!selectedRole}
                            >
                              Update Role
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabPanel>
              <TabPanel>
                <div className="p-6 bg-white">
                  <div className="text-center">
                    <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Permission management features coming soon...</p>
                  </div>
                </div>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </div>
      </div>
    </div>
  );
}

export default function UserSetupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserSetupContent />
    </Suspense>
  );
}
