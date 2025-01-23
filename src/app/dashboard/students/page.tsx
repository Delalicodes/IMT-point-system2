'use client';

import React, { useState, useEffect } from 'react';
import { User, GraduationCap, Mail, Phone, Calendar, BookOpen, MapPin, Search, Filter, Download, UserCheck, ShieldCheck, Shield } from 'lucide-react';
import { Badge } from '@tremor/react';
import toast from 'react-hot-toast';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: 'ACTIVE' | 'ONHOLD' | 'COMPLETED';
  createdAt: string;
  course: {
    id: string;
    name: string;
  } | null;
}

const statusColors = {
  ACTIVE: 'bg-green-50 text-green-700 ring-green-600/20',
  ONHOLD: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  COMPLETED: 'bg-blue-50 text-blue-700 ring-blue-600/20',
};

const roleColors = {
  STUDENT: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm hover:from-blue-600 hover:to-blue-700',
  SUPERVISOR: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm hover:from-purple-600 hover:to-purple-700',
};

const roleIcons = {
  STUDENT: Shield,
  SUPERVISOR: ShieldCheck,
};

const statusOptions = ['ACTIVE', 'ONHOLD', 'COMPLETED'];

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [studentToUpdateRole, setStudentToUpdateRole] = useState<{id: string, currentRole: string, name: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/students');
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (studentId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const response = await fetch('/api/students/update-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      await fetchStudents();
      
      if (selectedStudent?.id === studentId) {
        const updatedStudent = students.find(s => s.id === studentId);
        if (updatedStudent) {
          setSelectedStudent(updatedStudent);
        }
      }
      
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRoleToggle = async (studentId: string, currentRole: string) => {
    const newRole = currentRole === 'STUDENT' ? 'SUPERVISOR' : 'STUDENT';
    setIsUpdatingRole(true);
    try {
      const response = await fetch('/api/students/update-role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          role: newRole,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      await fetchStudents();
      
      if (selectedStudent?.id === studentId) {
        const updatedStudent = students.find(s => s.id === studentId);
        if (updatedStudent) {
          setSelectedStudent(updatedStudent);
        }
      }
      
      toast.success(`Role updated to ${newRole.toLowerCase()}`);
      setShowRoleModal(false);
      setStudentToUpdateRole(null);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const openRoleModal = (student: Student) => {
    setStudentToUpdateRole({
      id: student.id,
      currentRole: student.role || 'STUDENT',
      name: `${student.firstName} ${student.lastName}`
    });
    setShowRoleModal(true);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.course?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || student.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Role Change Modal */}
      {showRoleModal && studentToUpdateRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Change Role Confirmation
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to change <span className="font-medium">{studentToUpdateRole.name}</span>'s role from{' '}
              <span className="font-medium text-blue-600">{studentToUpdateRole.currentRole.toLowerCase()}</span> to{' '}
              <span className="font-medium text-purple-600">
                {studentToUpdateRole.currentRole === 'STUDENT' ? 'supervisor' : 'student'}
              </span>?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setStudentToUpdateRole(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRoleToggle(studentToUpdateRole.id, studentToUpdateRole.currentRole)}
                disabled={isUpdatingRole}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingRole ? 'Updating...' : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Students</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all students in the system including their personal details and course information.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
          >
            <option value="">All Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Course
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Role
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Contact
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-500">
                      Loading students...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-500">
                      No students found
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-0">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-gray-500">{student.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <GraduationCap className="h-4 w-4 text-gray-400 mr-2" />
                          {student.course?.name || 'No course assigned'}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <button
                          onClick={() => openRoleModal(student)}
                          disabled={isUpdatingRole}
                          className="group relative"
                        >
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${roleColors[(student.role || 'STUDENT') as keyof typeof roleColors]}`}>
                            {React.createElement(roleIcons[(student.role || 'STUDENT') as keyof typeof roleIcons], {
                              className: "h-4 w-4 mr-1.5"
                            })}
                            {(student.role || 'STUDENT').toLowerCase()}
                          </div>
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <select
                          value={student.status}
                          onChange={(e) => handleStatusChange(student.id, e.target.value)}
                          disabled={isUpdatingStatus}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusColors[student.status]} cursor-pointer`}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 text-gray-400 mr-2" />
                            {student.email || 'No email'}
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-gray-400 mr-2" />
                            {student.phoneNumber || 'No phone'}
                          </div>
                        </div>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View<span className="sr-only">, {student.firstName}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
