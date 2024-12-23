'use client';

import { useState, useEffect } from 'react';
import { Card, Title, Text } from '@tremor/react';
import { User, Award, Medal, Trophy, Star, UserCog, DollarSign } from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  totalPoints: number;
}

export default function DashboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const [pointsRes, usersRes] = await Promise.all([
          fetch('/api/points'),
          fetch('/api/users?role=STUDENT')
        ]);
        
        const [points, users] = await Promise.all([
          pointsRes.json(),
          usersRes.json()
        ]);

        const studentPoints = users.map((user: any) => {
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

    fetchStudents();
  }, []);

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

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-white text-gray-600 rounded-lg border hover:bg-gray-50">
              View Reports
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <UserCog className="text-blue-600 w-6 h-6" />
              </div>
              <div>
                <Text>Total Students</Text>
                <Title>{students.length}</Title>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Award className="text-green-600 w-6 h-6" />
              </div>
              <div>
                <Text>Total Points</Text>
                <Title>
                  {students.reduce((sum, student) => sum + student.totalPoints, 0)}
                </Title>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Trophy className="text-purple-600 w-6 h-6" />
              </div>
              <div>
                <Text>Top Score</Text>
                <Title>
                  {students[0]?.totalPoints || 0}
                </Title>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Mini Leaderboard */}
          <Card className="col-span-1">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Title>Top Students</Title>
                  <Text>Based on total points</Text>
                </div>
                <Award className="h-6 w-6 text-blue-500" />
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {students.slice(0, 5).map((student, index) => (
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

          {/* Other dashboard components can go here */}
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
