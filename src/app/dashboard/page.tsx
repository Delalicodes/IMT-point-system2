'use client';

import { useState, useEffect } from 'react';
import { Title, Text, Grid, Col, Metric, Flex, Badge, ProgressBar } from '@tremor/react';
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
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
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [currentUserStats, setCurrentUserStats] = useState<{
    rank: number;
    totalPoints: number;
    percentile: number;
    monthlyPoints: number;
    yearlyPoints: number;
  } | null>(null);

  const fetchPoints = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (selectedDate) {
        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
        
        queryParams.append('startDate', startDate.toISOString());
        queryParams.append('endDate', endDate.toISOString());
      }

      const response = await fetch(`/api/points?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch points');
      
      const data = await response.json();
      setStudents(data);

      if (session?.user?.id) {
        const userIndex = data.findIndex((s: Student) => s.id === session.user.id);
        if (userIndex !== -1) {
          const percentile = ((data.length - userIndex) / data.length) * 100;
          setCurrentUserStats({
            rank: userIndex + 1,
            totalPoints: data[userIndex].totalPoints,
            percentile: Math.round(percentile),
            monthlyPoints: data[userIndex].totalPoints,
            yearlyPoints: data[userIndex].totalPoints
          });
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching points:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchPoints();
    }
  }, [session, selectedDate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {/* Header with filters and top students */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-8">
            <h2 className="text-lg font-medium">My Credit Card</h2>
            <h2 className="text-lg font-medium">Statistics</h2>
          </div>
          <div className="flex items-center gap-4">
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date) => setSelectedDate(date)}
              dateFormat="yyyy-MM-dd"
              className="bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm w-32"
              placeholderText="Select date"
            />
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date) => setSelectedDate(date)}
              dateFormat="yyyy-MM-dd"
              className="bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm w-32"
              placeholderText="Select date"
            />
          </div>
        </div>

        {/* Top Students Row */}
        <div className="grid grid-cols-2 gap-6">
          {/* Leaderboard */}
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Leaderboard</h3>
                <p className="text-white/70 text-sm">Overall Rankings</p>
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

          {/* Top 3 Badges */}
          <div className="bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Top Performers</h3>
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
              {students.slice(0, 3).map((student, index) => (
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

      {/* Main Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Monthly Sale Card */}
          <div className="bg-white rounded-xl p-4">
            <Text className="mb-2">Monthly Sale</Text>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold">20,541</span>
              <span className="text-amber-500">↓ 15%</span>
            </div>
            <div className="mt-2">
              <div className="h-1 bg-amber-100 rounded-full">
                <div className="h-1 w-[15%] bg-amber-500 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Yearly Sale Card */}
          <div className="bg-white rounded-xl p-4">
            <Text className="mb-2">Yearly Sale</Text>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold">20,541,125</span>
              <span className="text-green-500">↑ 75%</span>
            </div>
            <div className="mt-2">
              <div className="h-1 bg-green-100 rounded-full">
                <div className="h-1 w-[75%] bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Statistics Chart */}
          <div className="bg-white rounded-xl p-4">
            <div className="h-[200px] flex items-center justify-center text-gray-400">
              Chart Component Here
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <Text>Calendar</Text>
              <div className="flex gap-2">
                <button className="p-1 hover:bg-gray-100 rounded">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date) => setSelectedDate(date)}
              inline
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
