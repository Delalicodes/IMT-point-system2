'use client';

import { useState, useEffect } from 'react';
import { Title, Text, Grid, Col, Metric, Flex, Badge, ProgressBar, Card } from '@tremor/react';
import { ChevronLeft, ChevronRight, MoreVertical, Users, Trophy, Target, Star, Calendar } from 'lucide-react';
import { useSession } from 'next-auth/react';
import DatePicker from 'react-datepicker';
import { Dialog } from '@headlessui/react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import ActiveUsers from '@/components/ActiveUsers';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  totalPoints: number;
}

interface WeeklyPoints {
  totalPoints: number;
  weekStart: string;
  weekEnd: string;
  students: {
    id: string;
    firstName: string;
    lastName: string;
    points: number;
    trend: 'up' | 'down' | 'neutral';
  }[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isWeeklyDialogOpen, setIsWeeklyDialogOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [weeklyPoints, setWeeklyPoints] = useState<WeeklyPoints | null>(null);

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

  const fetchWeeklyPoints = async (date: Date = selectedWeek) => {
    const start = startOfWeek(date);
    const end = endOfWeek(date);
    
    try {
      const queryParams = new URLSearchParams({
        startDate: start.toISOString(),
        endDate: end.toISOString()
      });

      console.log('Fetching weekly points for:', { start, end });
      const response = await fetch(`/api/points/weekly?${queryParams}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to fetch weekly points: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Weekly points data:', data);
      
      if (!data.students) {
        console.error('Invalid data format:', data);
        throw new Error('Invalid data format received from API');
      }

      setWeeklyPoints({
        totalPoints: data.totalPoints || 0,
        weekStart: format(start, 'MMM dd, yyyy'),
        weekEnd: format(end, 'MMM dd, yyyy'),
        students: Array.isArray(data.students) ? data.students.map((student: any) => ({
          ...student,
          trend: 'neutral'
        })) : []
      });
    } catch (error) {
      console.error('Error fetching weekly points:', error);
      setWeeklyPoints({
        totalPoints: 0,
        weekStart: format(start, 'MMM dd, yyyy'),
        weekEnd: format(end, 'MMM dd, yyyy'),
        students: []
      });
    }
  };

  const handlePreviousWeek = () => {
    const newDate = subWeeks(selectedWeek, 1);
    setSelectedWeek(newDate);
    fetchWeeklyPoints(newDate);
  };

  const handleNextWeek = () => {
    const newDate = addWeeks(selectedWeek, 1);
    setSelectedWeek(newDate);
    fetchWeeklyPoints(newDate);
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

  useEffect(() => {
    if (isWeeklyDialogOpen) {
      console.log('Dialog opened, fetching weekly points...');
      fetchWeeklyPoints(selectedWeek);
    }
  }, [isWeeklyDialogOpen, selectedWeek]);

  return (
    <main className="p-4 md:p-10 mx-auto max-w-7xl">
        <>
          <div className="flex justify-between items-center mb-6">
            <Title>Dashboard</Title>
            <div className="flex items-center gap-4">
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null) => setSelectedDate(date)}
                dateFormat="yyyy-MM-dd"
                className="bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm w-32"
                placeholderText="Select date"
              />
              <button
                onClick={() => setIsWeeklyDialogOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span>View Weekly Points</span>
              </button>
            </div>
          </div>

          {/* Weekly Points Dialog */}
          <Dialog
            open={isWeeklyDialogOpen}
            onClose={() => setIsWeeklyDialogOpen(false)}
            className="relative z-50"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel className="w-full max-w-2xl bg-white rounded-xl p-6 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title className="text-xl font-semibold text-gray-900">
                    Weekly Points Summary
                  </Dialog.Title>
                  <button
                    onClick={() => setIsWeeklyDialogOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={handlePreviousWeek}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">
                      {weeklyPoints?.weekStart} - {weeklyPoints?.weekEnd}
                    </div>
                  </div>
                  <button
                    onClick={handleNextWeek}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="text-sm text-gray-500 mb-1">Total Points This Week</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {weeklyPoints?.totalPoints?.toLocaleString() ?? 0}
                  </div>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {weeklyPoints?.students.map((student) => (
                    <div
                      key={student.id}
                      className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-medium">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Student
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 rounded-full flex items-center gap-1 text-sm ${
                          student.trend === 'up' 
                            ? 'bg-green-50 text-green-700' 
                            : student.trend === 'down'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-gray-50 text-gray-700'
                        }`}>
                          {student.trend === 'up' && (
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          {student.trend === 'down' && (
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          {student.points.toLocaleString()} pts
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                          <Trophy className={`w-4 h-4 ${
                            student.points >= 100 ? 'text-yellow-500' :
                            student.points >= 50 ? 'text-gray-400' :
                            'text-amber-600'
                          }`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setIsWeeklyDialogOpen(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>

          {/* Header with filters and top students */}
          <div className="mb-6">
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
                      } transition-all duration-200`}>
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
                      } p-3`}>
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

          <ActiveUsers />
        </>
    </main>
  );
  }
