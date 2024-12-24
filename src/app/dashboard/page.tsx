'use client';

import { useState, useEffect } from 'react';
import { Title, Text, Grid, Col, Metric, Flex, Badge, ProgressBar, Card } from '@tremor/react';
import { ChevronLeft, ChevronRight, MoreVertical, Users, Trophy, Target, Star } from 'lucide-react';
import { useSession } from 'next-auth/react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  totalPoints: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

  const fetchOverallLeaderboard = async () => {
    try {
      const response = await fetch('/api/points');
      if (!response.ok) throw new Error('Failed to fetch points');
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchFilteredTopPerformers = async () => {
    try {
      if (!selectedDate) return;

      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      const queryParams = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const response = await fetch(`/api/points/filtered?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch filtered points');
      const data = await response.json();
      setFilteredStudents(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchOverallLeaderboard();
      fetchFilteredTopPerformers();
    }
  }, [session]);

  useEffect(() => {
    if (selectedDate) {
      fetchFilteredTopPerformers();
    }
  }, [selectedDate]);

  return (
    <main className="p-4 md:p-10 mx-auto max-w-7xl">
      <Title>Dashboard</Title>
      <Text>Welcome to your dashboard</Text>

      {/* Header with filters and top students */}
      <div className="mb-6">
        <div className="flex justify-end mb-6">
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date) => setSelectedDate(date)}
            dateFormat="yyyy-MM-dd"
            className="bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm w-32"
            placeholderText="Select date"
          />
        </div>

        {/* Top Students Row */}
        <div className="grid grid-cols-2 gap-6">
          {/* Overall Leaderboard */}
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Overall Leaderboard</h3>
                <p className="text-white/70 text-sm">Total points earned</p>
              </div>
            </div>
            <div className="space-y-3">
              {students.slice(0, 5).map((student, index) => (
                <div 
                  key={student.id} 
                  className={`relative flex items-center p-3 rounded-lg ${
                    index === 0 ? 'bg-white/20' : 'hover:bg-white/10'
                  } transition-all duration-200`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-300 text-gray-700' :
                    index === 2 ? 'bg-amber-600 text-amber-100' :
                    'bg-white/10 text-white'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium text-sm">{student.firstName} {student.lastName}</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white rounded-full"
                          style={{ width: `${(student.totalPoints / (students[0]?.totalPoints || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-white/70 text-sm">{student.totalPoints.toLocaleString()} pts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Top Performers */}
          <div className="bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Daily Top Performers</h3>
                <p className="text-white/70 text-sm">
                  {selectedDate ? selectedDate.toLocaleDateString('en-US', { 
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'All time'}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {filteredStudents.slice(0, 3).map((student, index) => (
                <div 
                  key={student.id}
                  className={`relative overflow-hidden rounded-lg ${
                    index === 0 ? 'bg-yellow-400/20 border border-yellow-400/30' :
                    index === 1 ? 'bg-gray-400/20 border border-gray-400/30' :
                    'bg-amber-700/20 border border-amber-700/30'
                  } p-3`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      'bg-amber-600 text-amber-100'
                    } font-bold text-lg`}>
                      #{index + 1}
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm">{student.firstName} {student.lastName}</h4>
                      <div className="flex items-center gap-1 text-white/70">
                        <span className="text-base font-semibold">{student.totalPoints.toLocaleString()}</span>
                        <span className="text-xs">pts</span>
                      </div>
                    </div>
                    <div className={`absolute -right-6 -top-6 w-16 h-16 rounded-full ${
                      index === 0 ? 'bg-yellow-400/10' :
                      index === 1 ? 'bg-gray-400/10' :
                      'bg-amber-700/10'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white shadow-sm rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <Text className="text-sm text-gray-500">Total Students</Text>
              <div className="text-xl font-semibold">{students.length}</div>
            </div>
          </div>
        </Card>

        <Card className="bg-white shadow-sm rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Trophy className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <Text className="text-sm text-gray-500">Total Points</Text>
              <div className="text-xl font-semibold">
                {students.reduce((sum, student) => sum + student.totalPoints, 0).toLocaleString()}
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-white shadow-sm rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Target className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <Text className="text-sm text-gray-500">Average Points</Text>
              <div className="text-xl font-semibold">
                {students.length > 0 
                  ? Math.round(students.reduce((sum, student) => sum + student.totalPoints, 0) / students.length)
                  : '0'}
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-white shadow-sm rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <Text className="text-sm text-gray-500">Top Score</Text>
              <div className="text-xl font-semibold">
                {students.length > 0 
                  ? Math.max(...students.map(student => student.totalPoints))
                  : 0}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
