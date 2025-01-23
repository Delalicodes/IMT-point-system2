'use client';

import { useState, useEffect } from 'react';
import { Card, Title, Text, Badge, TextInput } from '@tremor/react';
import { Search, Mail, Shield, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

interface Supervisor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  course?: {
    id: string;
    name: string;
  };
}

export default function SupervisorSetupPage() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const fetchSupervisors = async () => {
    try {
      const response = await fetch('/api/supervisors');
      const data = await response.json();
      if (response.ok) {
        setSupervisors(data);
      } else {
        toast.error('Failed to load supervisors');
      }
    } catch (error) {
      console.error('Error fetching supervisors:', error);
      toast.error('Failed to load supervisors');
    } finally {
      setLoading(false);
    }
  };

  const filteredSupervisors = supervisors.filter(supervisor =>
    `${supervisor.firstName} ${supervisor.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supervisor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supervisor.course?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Supervisor Management</h1>
        <Text className="mt-1">View supervisors and their assigned courses</Text>
      </div>

      {/* Search and Filters */}
      <Card className="rounded-xl">
        <div className="relative">
          <TextInput
            icon={Search}
            placeholder="Search supervisors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md rounded-xl"
          />
        </div>
      </Card>

      {/* Supervisors List */}
      <Card className="rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Course</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                    Loading supervisors...
                  </td>
                </tr>
              ) : filteredSupervisors.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                    No supervisors found
                  </td>
                </tr>
              ) : (
                filteredSupervisors.map((supervisor) => (
                  <tr key={supervisor.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-purple-100 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{supervisor.firstName} {supervisor.lastName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center text-gray-500">
                        <Mail className="h-4 w-4 mr-2" />
                        {supervisor.email}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <GraduationCap className="h-4 w-4 mr-2 text-gray-500" />
                        {supervisor.course ? (
                          <Badge 
                            className="rounded-xl bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 text-sm font-medium"
                          >
                            {supervisor.course.name}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">No course assigned</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
