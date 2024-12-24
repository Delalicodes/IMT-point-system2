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
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserStats, setCurrentUserStats] = useState<{
    rank: number;
    totalPoints: number;
    percentile: number;
    monthlyPoints: number;
    yearlyPoints: number;
  } | null>(null);
  const [pointsHistory, setPointsHistory] = useState<Array<{ date: string; points: number }>>([]);

  const fetchOverallLeaderboard = async () => {
    try {
      const response = await fetch('/api/points');
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

      console.log('Fetching filtered data for:', { startDate, endDate });
      const response = await fetch(`/api/points/filtered?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch filtered points');
      const data = await response.json();
      console.log('Filtered data received:', data);
      setFilteredStudents(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchPointsHistory = async () => {
    try {
      const response = await fetch('/api/points/history?days=7');
      if (!response.ok) throw new Error('Failed to fetch points history');
      const data = await response.json();
      setPointsHistory(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    if (session?.user) {
      // Fetch overall leaderboard once
      fetchOverallLeaderboard();
      // Also fetch initial filtered data
      fetchFilteredTopPerformers();
      // Fetch points history
      fetchPointsHistory();
      setIsLoading(false);
    }
  }, [session]);

  // Make sure to update filtered data when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchFilteredTopPerformers();
    }
  }, [selectedDate]);

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

      {/* Points Distribution and Achievements */}
      <div className="mt-6 space-y-6">
        {/* Points Distribution Chart */}
        <div className="bg-white rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Points History</h3>
              <p className="text-sm text-gray-500">Last 7 days distribution</p>
            </div>
          </div>
          <div className="h-[200px] space-y-4">
            {/* Last 7 days bars */}
            {pointsHistory.map((day, index) => {
              const date = new Date(day.date);
              const maxPoints = Math.max(...pointsHistory.map(d => d.points));
              const percentage = maxPoints > 0 ? (day.points / maxPoints) * 100 : 0;
              
              return (
                <div key={day.date} className="flex items-center gap-3">
                  <div className="w-20 text-sm text-gray-500">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-20 text-sm text-gray-500 text-right">
                    {day.points.toLocaleString()} pts
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievement Progress */}
        <div className="bg-white rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Achievement Progress</h3>
              <p className="text-sm text-gray-500">Your milestones</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[
              { name: 'Bronze', target: 1000, color: 'amber' },
              { name: 'Silver', target: 5000, color: 'gray' },
              { name: 'Gold', target: 10000, color: 'yellow' }
            ].map((achievement) => {
              const userPoints = currentUserStats?.totalPoints || 0;
              const progress = Math.min((userPoints / achievement.target) * 100, 100);
              
              return (
                <div key={achievement.name} className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-3">
                    {/* Background circle */}
                    <div className={`absolute inset-0 rounded-full border-4 border-${achievement.color}-100`} />
                    {/* Progress circle */}
                    <div 
                      className={`absolute inset-0 rounded-full border-4 border-${achievement.color}-500`}
                      style={{
                        clipPath: `polygon(50% 50%, -50% -50%, ${progress}% ${progress}%)`,
                        transform: 'rotate(-90deg)',
                      }}
                    />
                    {/* Center content */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-semibold">{Math.round(progress)}%</span>
                    </div>
                  </div>
                  <h4 className="font-medium text-gray-900">{achievement.name}</h4>
                  <p className="text-sm text-gray-500">{achievement.target.toLocaleString()} pts</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
