'use client';

import { useState, useEffect } from 'react';
import { Card, Title, Text, Select, SelectItem } from '@tremor/react';
import { User, Award, Medal, Trophy, Star, Calendar } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  totalPoints: number;
}

type TimeFilter = 'day' | 'month' | 'year' | 'all';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('day');
  const isAdmin = session?.user?.role === 'ADMIN';

  const getFilteredDate = (filter: TimeFilter) => {
    const now = new Date();
    switch (filter) {
      case 'day':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      case 'year':
        return new Date(now.getFullYear(), 0, 1).toISOString();
      default:
        return null;
    }
  };

  useEffect(() => {
    async function fetchPoints() {
      try {
        const fromDate = getFilteredDate(timeFilter);
        const queryParams = new URLSearchParams();
        if (fromDate) {
          queryParams.append('from', fromDate);
        }
        if (!isAdmin && session?.user?.id) {
          queryParams.append('userId', session.user.id);
        }

        const [pointsRes, usersRes] = await Promise.all([
          fetch(`/api/points?${queryParams}`),
          fetch('/api/users?role=STUDENT')
        ]);
        
        const [points, users] = await Promise.all([
          pointsRes.json(),
          usersRes.json()
        ]);

        const studentPoints = users
          .filter((user: any) => isAdmin || user.id === session?.user?.id)
          .map((user: any) => {
            const userPoints = points.filter((p: any) => p.userId === user.id);
            const totalPoints = userPoints.reduce((sum: number, p: any) => sum + p.points, 0);
            return {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              totalPoints,
            };
          });

        const sortedStudents = studentPoints.sort((a: Student, b: Student) => b.totalPoints - a.totalPoints);
        setStudents(sortedStudents);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session) {
      fetchPoints();
    }
  }, [session, timeFilter, isAdmin]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <Star className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'day':
        return "Today's";
      case 'month':
        return "This Month's";
      case 'year':
        return "This Year's";
      default:
        return 'Overall';
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header with Filter */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Select
              value={timeFilter}
              onValueChange={(value) => setTimeFilter(value as TimeFilter)}
              className="w-40"
            >
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </Select>
          </div>
        </div>

        {/* Top Students Stats */}
        {isAdmin ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {students.slice(0, 3).map((student, index) => (
              <Card key={student.id} className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    {getRankIcon(index)}
                  </div>
                  <div>
                    <Text className="text-gray-500">{`${index + 1}${index === 0 ? 'st' : index === 1 ? 'nd' : 'rd'} Place`}</Text>
                    <Title className="truncate">{student.firstName} {student.lastName}</Title>
                    <div className={`text-sm font-semibold ${
                      student.totalPoints >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {student.totalPoints >= 0 ? '+' : ''}{student.totalPoints} points
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mb-6">
            <Card className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Trophy className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <Text>{getTimeFilterLabel()} Points</Text>
                  <Title>
                    {students[0]?.totalPoints || 0}
                  </Title>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Points History */}
          <Card className="col-span-1">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Title>Points History</Title>
                  <Text>{getTimeFilterLabel()} Summary</Text>
                </div>
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {(isAdmin ? students : students.slice(0, 1)).map((student, index) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8">
                          {getRankIcon(index)}
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-medium text-sm">
                              {student.firstName[0]}{student.lastName[0]}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </div>
                        </div>
                      </div>
                      <div className={`text-sm font-semibold ${
                        student.totalPoints >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {student.totalPoints >= 0 ? '+' : ''}{student.totalPoints}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Other dashboard components */}
          <Card className="col-span-2">
            <div className="p-4">
              <Title>Recent Activity</Title>
              <Text>Coming soon...</Text>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
