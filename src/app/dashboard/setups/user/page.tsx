'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Card, Tab, TabList, TabGroup, TabPanel, TabPanels, TextInput, Select, SelectItem, Badge, Button } from '@tremor/react';
import { UserPlus, Users, Settings, Lock, Search, Filter, MoreVertical, Edit2, Trash2, UserCheck, UserX } from 'lucide-react';

// Mock data for demonstration
const mockUsers = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe',
    role: 'Admin',
    status: 'Active',
    lastLogin: '2024-12-14',
  },
  {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    username: 'janesmith',
    role: 'User',
    status: 'Active',
    lastLogin: '2024-12-13',
  },
  // Add more mock users as needed
];

export default function UserSetupPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/students/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      toast.success('Student created successfully');
      setFormData({
        firstName: '',
        lastName: '',
        username: '',
        password: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">User Setup</h1>
          <p className="text-gray-500 mt-1">Manage users and permissions</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <TabGroup>
            <div className="border-b border-gray-100">
              <TabList className="flex">
                <Tab className="flex items-center space-x-2 px-6 py-4 text-sm font-medium text-gray-500 hover:text-blue-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 transition-all duration-200">
                  <UserPlus className="w-4 h-4" />
                  <span>Create User</span>
                </Tab>
                <Tab className="flex items-center space-x-2 px-6 py-4 text-sm font-medium text-gray-500 hover:text-blue-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 transition-all duration-200">
                  <Users className="w-4 h-4" />
                  <span>Manage Users</span>
                </Tab>
                <Tab className="flex items-center space-x-2 px-6 py-4 text-sm font-medium text-gray-500 hover:text-blue-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 transition-all duration-200">
                  <Lock className="w-4 h-4" />
                  <span>Permissions</span>
                </Tab>
              </TabList>
            </div>
            <TabPanels>
              <TabPanel>
                <div className="p-6">
                  <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
                    <div className="bg-white rounded-lg">
                      <div className="flex items-center space-x-2 mb-6">
                        <UserPlus className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                            First Name
                          </label>
                          <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="Enter first name"
                          />
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name
                          </label>
                          <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="Enter last name"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg">
                      <div className="flex items-center space-x-2 mb-6">
                        <Lock className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-medium text-gray-900">Login Credentials</h3>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                            Username
                          </label>
                          <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="Choose a username"
                          />
                        </div>

                        <div>
                          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                          </label>
                          <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="Enter password"
                          />
                        </div>

                        <div>
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm Password
                          </label>
                          <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="Confirm password"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ${
                        isLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isLoading ? 'Creating...' : 'Create User'}
                    </button>
                  </form>
                </div>
              </TabPanel>
              <TabPanel>
                <div className="p-6">
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Manage Users</h2>
                      <Button
                        size="sm"
                        color="blue"
                        icon={UserPlus}
                        className="shadow-sm hover:shadow-md transition-shadow"
                      >
                        Add New User
                      </Button>
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
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
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
                        >
                          <Filter className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-100">
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
                                    setSelectedUsers(mockUsers.map(user => user.id));
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
                          {mockUsers.map((user) => (
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
                                <Badge color={user.role === 'Admin' ? 'blue' : 'gray'}>
                                  {user.role}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge color={user.status === 'Active' ? 'green' : 'red'}>
                                  {user.status}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.lastLogin}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex space-x-2">
                                  <button className="p-1 hover:bg-gray-100 rounded-full">
                                    <Edit2 className="w-4 h-4 text-gray-500" />
                                  </button>
                                  <button className="p-1 hover:bg-gray-100 rounded-full">
                                    {user.status === 'Active' ? (
                                      <UserX className="w-4 h-4 text-gray-500" />
                                    ) : (
                                      <UserCheck className="w-4 h-4 text-gray-500" />
                                    )}
                                  </button>
                                  <button className="p-1 hover:bg-gray-100 rounded-full">
                                    <Trash2 className="w-4 h-4 text-gray-500" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                      >
                        Delete Selected
                      </Button>
                      <Button
                        size="sm"
                        color="blue"
                      >
                        Change Role
                      </Button>
                    </div>
                  )}
                </div>
              </TabPanel>
              <TabPanel>
                <div className="p-6 text-center">
                  <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Permission management features coming soon...</p>
                </div>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </div>
      </div>
    </div>
  );
}
