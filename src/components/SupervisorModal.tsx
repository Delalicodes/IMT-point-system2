'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Select, SelectItem, Button } from '@tremor/react';
import { X, UserPlus, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface SupervisorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupervisorModal({ isOpen, onClose }: SupervisorModalProps) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const fetchSupervisors = async () => {
    try {
      const response = await fetch('/api/students');
      const data = await response.json();
      if (response.ok) {
        // Filter users with SUPERVISOR role
        const supervisorUsers = data.filter((user: User) => user.role === 'SUPERVISOR');
        setSupervisors(supervisorUsers);
      }
    } catch (error) {
      console.error('Error fetching supervisors:', error);
      toast.error('Failed to load supervisors');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error('Please select a supervisor');
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
          userId: selectedUserId,
        }),
      });

      if (response.ok) {
        toast.success('Supervisor added successfully');
        onClose();
        setSelectedUserId('');
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
                <label htmlFor="supervisor" className="block text-sm font-medium text-gray-700">
                  Select Supervisor
                </label>
                <div className="relative">
                  <Select
                    id="supervisor"
                    placeholder="Select a supervisor"
                    value={selectedUserId}
                    onValueChange={setSelectedUserId}
                    icon={Shield}
                    className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  >
                    {supervisors.map((supervisor) => (
                      <SelectItem key={supervisor.id} value={supervisor.id} className="py-2.5">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-purple-500" />
                          <span>{supervisor.firstName} {supervisor.lastName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Select from the list of users with supervisor role
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
