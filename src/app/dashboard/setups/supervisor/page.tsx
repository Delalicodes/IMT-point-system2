'use client';

import { useState, useEffect } from 'react';
import { Card, Title, Text, Button, Badge, TextInput } from '@tremor/react';
import { UserPlus, Search, Mail, Trash2, Edit2, School } from 'lucide-react';
import SupervisorModal from '@/components/SupervisorModal';
import toast from 'react-hot-toast';

interface Supervisor {
  id: string;
  name: string;
  email: string;
  course: {
    name: string;
  };
}

export default function SupervisorSetupPage() {
  const [showModal, setShowModal] = useState(false);
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supervisor?')) return;

    try {
      const response = await fetch(`/api/supervisors/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Supervisor deleted successfully');
        fetchSupervisors();
      } else {
        toast.error('Failed to delete supervisor');
      }
    } catch (error) {
      console.error('Error deleting supervisor:', error);
      toast.error('Failed to delete supervisor');
    }
  };

  const filteredSupervisors = supervisors.filter(supervisor =>
    supervisor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supervisor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supervisor.course.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supervisor Management</h1>
          <Text className="mt-1">Manage supervisors and their assigned courses</Text>
        </div>
        <Button 
          icon={UserPlus}
          onClick={() => setShowModal(true)}
          className="w-full md:w-auto rounded-xl"
        >
          Add Supervisor
        </Button>
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
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Loading supervisors...
                  </td>
                </tr>
              ) : filteredSupervisors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No supervisors found
                  </td>
                </tr>
              ) : (
                filteredSupervisors.map((supervisor) => (
                  <tr key={supervisor.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-gray-100 flex items-center justify-center">
                          <UserPlus className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{supervisor.name}</div>
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
                        <School className="h-4 w-4 mr-2 text-gray-500" />
                        <Badge color="blue" className="rounded-xl">{supervisor.course.name}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="secondary"
                          size="xs"
                          icon={Edit2}
                          onClick={() => toast.success('Edit feature coming soon')}
                          className="rounded-xl"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          size="xs"
                          icon={Trash2}
                          color="red"
                          onClick={() => handleDelete(supervisor.id)}
                          className="rounded-xl"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <SupervisorModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          fetchSupervisors();
        }}
      />
    </div>
  );
}
