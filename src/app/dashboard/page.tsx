'use client';

import { useState, useEffect } from 'react';
import { Card, Title, Text, Grid, Col, Metric, Flex, Badge, ProgressBar } from '@tremor/react';
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
      const response = await fetch('/api/points');
      if (!response.ok) throw new Error('Failed to fetch points');
      
      const data = await response.json();
      const sortedStudents = data.sort((a: Student, b: Student) => b.totalPoints - a.totalPoints);
      setStudents(sortedStudents);

      if (session?.user?.id) {
        const userIndex = sortedStudents.findIndex((s: Student) => s.id === session.user.id);
        if (userIndex !== -1) {
          const percentile = ((sortedStudents.length - userIndex) / sortedStudents.length) * 100;
          setCurrentUserStats({
            rank: userIndex + 1,
            totalPoints: sortedStudents[userIndex].totalPoints,
            percentile: Math.round(percentile),
            monthlyPoints: sortedStudents[userIndex].totalPoints,
            yearlyPoints: sortedStudents[userIndex].totalPoints
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
  }, [session]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {/* Header with filters */}
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

      {/* Main Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Leaderboard Card */}
          <Card className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Top Students</h3>
                  <p className="text-white/70 text-sm">Based on total points</p>
                </div>
                <button className="text-white/80 hover:text-white">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                {students.slice(0, 5).map((student, index) => (
                  <div 
                    key={student.id} 
                    className={`relative flex items-center p-3 rounded-xl ${
                      index === 0 ? 'bg-white/20' : 'hover:bg-white/10'
                    } transition-all duration-200`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-4 ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-amber-600 text-amber-100' :
                      'bg-white/10 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{student.firstName} {student.lastName}</h4>
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
                    {index === 0 && (
                      <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 px-2 py-0.5 text-xs font-semibold rounded-full">
                        Leader
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {session?.user?.id && currentUserStats && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="flex items-center p-3 rounded-xl bg-white/10">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-4 bg-white/10 text-white">
                      {currentUserStats.rank}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">Your Position</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-white rounded-full"
                            style={{ width: `${(currentUserStats.totalPoints / (students[0]?.totalPoints || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-white/70 text-sm">{currentUserStats.totalPoints.toLocaleString()} pts</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Monthly Stats */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <div className="p-4">
                <Text className="mb-2">Earning in Month</Text>
                <div className="relative w-32 h-32 mx-auto">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-2xl font-semibold">75%</div>
                  </div>
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#eee"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="3"
                      strokeDasharray="75, 100"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Expected:</span>
                    <span>$30,541,875,874</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Payable:</span>
                    <span>$505,875,874</span>
                  </div>
                </div>
              </div>
            </Card>

            <div className="space-y-6">
              <Card>
                <div className="p-4">
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
              </Card>

              <Card>
                <div className="p-4">
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
              </Card>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Statistics Chart */}
          <Card>
            <div className="p-4">
              <div className="h-[200px] flex items-center justify-center text-gray-400">
                Chart Component Here
              </div>
            </div>
          </Card>

          {/* Calendar */}
          <Card>
            <div className="p-4">
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
          </Card>
        </div>
      </div>
    </div>
  );
}
