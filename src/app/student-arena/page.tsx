'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Card,
  Title,
  Text,
  TabList,
  Tab,
  TabGroup,
  TabPanels,
  TabPanel,
  List,
  ListItem,
  ProgressBar,
  Flex,
  Bold,
  Metric,
  DonutChart,
  BarChart,
  Badge,
} from '@tremor/react';
import {
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Clock,
  Award,
  Star,
  Users,
  PlusCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import ClockingDialog from '@/components/ClockingDialog';
import TaskModal from '@/components/TaskModal';

interface PointData {
  date: string;
  points: number;
  course: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: any;
  color: string;
  earned: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'PENDING' | 'COMPLETED';
}

const chartColors = [
  '#7DD3FC', // lighter blue
  '#FDA4AF', // lighter pink
  '#FCD34D', // soft yellow
  '#86EFAC', // mint green
  '#C4B5FD', // lavender
  '#FED7AA'  // peach
];

export default function StudentArena() {
  const { data: session } = useSession();
  const [totalPoints, setTotalPoints] = useState(0);
  const [dailyPoints, setDailyPoints] = useState(0);
  const [weeklyPoints, setWeeklyPoints] = useState(0);
  const [leaderboardPosition, setLeaderboardPosition] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [pointHistory, setPointHistory] = useState<PointData[]>([]);
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'Quick Learner',
      description: 'Earn 50 points in a single day',
      points: 50,
      icon: Trophy,
      color: 'bg-yellow-500',
      earned: true,
    },
    {
      id: '2',
      title: 'Knowledge Seeker',
      description: 'Complete 5 different courses',
      points: 100,
      icon: Award,
      color: 'bg-blue-500',
      earned: true,
    },
    {
      id: '3',
      title: 'Master Student',
      description: 'Reach level 10',
      points: 200,
      icon: Star,
      color: 'bg-purple-500',
      earned: false,
    },
  ];

  useEffect(() => {
    if (session?.user?.id) {
      fetchPointData();
      fetchTasks();
      const eventSource = new EventSource(`/api/points/updates?userId=${session.user.id}`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'POINTS_ADDED') {
          fetchPointData();
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        eventSource.close();
      };

      return () => {
        eventSource.close();
      };
    }
  }, [session]);

  const fetchPointData = async () => {
    try {
      const response = await fetch('/api/student/points');
      const data = await response.json();
      
      setTotalPoints(data.total || 0);
      setDailyPoints(data.daily || 0);
      setWeeklyPoints(data.weekly || 0);
      setLeaderboardPosition(data.leaderboardPosition || 0);
      setTotalStudents(data.totalStudents || 0);
      
      const formattedHistory = (data.history || []).map((point: any) => ({
        date: new Date(point.date).toLocaleDateString(),
        points: point.points || 0,
        course: point.course || 'General'
      }));
      setPointHistory(formattedHistory);
      
      setLoading(false);
      if ((data.total || 0) > 0 && !showAnimation) {
        setShowAnimation(true);
        triggerConfetti();
      }
    } catch (error) {
      console.error('Error fetching point data:', error);
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setTasksLoading(true);
      setTasksError(null);
      
      if (!session?.user?.id) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/tasks', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasksError('Failed to fetch tasks. Please try again later.');
    } finally {
      setTasksLoading(false);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const getOrdinalSuffix = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'status'>) => {
    try {
      if (!session?.user?.id) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      const newTask = await response.json();
      setTasks((prevTasks) => [...prevTasks, newTask]);
      setIsTaskModalOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: 'PENDING' | 'COMPLETED') => {
    try {
      if (!session?.user?.id) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );

      if (newStatus === 'COMPLETED') {
        // Maybe trigger some points or achievements here
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      // You might want to show an error message to the user here
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <h1 className="text-4xl font-bold mb-2">Welcome to Your Learning Journey! 🚀</h1>
          <p className="text-blue-100 text-lg">Track your progress, earn achievements, and level up your knowledge!</p>
        </motion.div>
        <div className="absolute top-0 left-0 w-full h-full bg-white/10 backdrop-blur-sm"></div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="transform hover:scale-105 transition-all duration-300"
        >
          <Card className="rounded-2xl shadow-lg hover:shadow-xl border border-blue-100">
            <Flex alignItems="center" className="space-x-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Trophy className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <Text className="text-sm font-medium text-gray-600">Total Points</Text>
                <Metric>{totalPoints.toLocaleString()}</Metric>
              </div>
            </Flex>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="transform hover:scale-105 transition-all duration-300"
        >
          <Card className="rounded-2xl shadow-lg hover:shadow-xl border border-green-100">
            <Flex alignItems="center" className="space-x-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <Text className="text-sm font-medium text-gray-600">Weekly Points</Text>
                <Metric>{weeklyPoints.toLocaleString()}</Metric>
              </div>
            </Flex>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="transform hover:scale-105 transition-all duration-300"
        >
          <Card className="rounded-2xl shadow-lg hover:shadow-xl border border-amber-100">
            <Flex alignItems="center" className="space-x-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <Text className="text-sm font-medium text-gray-600">Daily Points</Text>
                <Metric>{dailyPoints.toLocaleString()}</Metric>
              </div>
            </Flex>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="transform hover:scale-105 transition-all duration-300"
        >
          <Card className="rounded-2xl shadow-lg hover:shadow-xl border border-purple-100">
            <Flex alignItems="center" className="space-x-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <Text className="text-sm font-medium text-gray-600">Rank</Text>
                <Metric>{getOrdinalSuffix(leaderboardPosition)}</Metric>
                <Text className="text-xs text-gray-500">out of {totalStudents} students</Text>
              </div>
            </Flex>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Points Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="rounded-2xl shadow-lg hover:shadow-xl border border-gray-100">
            <Title>Points Distribution</Title>
            <DonutChart
              className="mt-6 h-72"
              data={pointHistory.reduce((acc, curr) => {
                const existing = acc.find(item => item.course === curr.course);
                if (existing) {
                  existing.points += curr.points;
                } else {
                  acc.push({
                    course: curr.course,
                    points: curr.points
                  });
                }
                return acc;
              }, [] as { course: string; points: number }[])}
              index="course"
              category="points"
              variant="pie"
              valueFormatter={(value) => `${value.toLocaleString()} points`}
              colors={chartColors}
            />
          </Card>
        </motion.div>

        {/* Weekly Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="rounded-2xl shadow-lg hover:shadow-xl border border-gray-100">
            <Title>Weekly Progress</Title>
            <BarChart
              className="mt-6 h-72"
              data={pointHistory.slice(-7)}
              index="date"
              categories={["points"]}
              colors={["blue"]}
              valueFormatter={(value) => `${value.toLocaleString()} points`}
              yAxisWidth={48}
            />
          </Card>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="rounded-2xl shadow-lg hover:shadow-xl border border-gray-100">
            <Title>Achievements</Title>
            <List className="mt-6">
              {achievements.map((achievement, index) => (
                <ListItem key={index} className="space-y-2">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-xl ${achievement.color}`}>
                      <achievement.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <Text className="font-medium">{achievement.title}</Text>
                      <Text className="text-sm text-gray-500">{achievement.description}</Text>
                      <Badge 
                        className="mt-2" 
                        color={achievement.earned ? 'green' : 'gray'}
                      >
                        {achievement.earned ? 'Earned' : 'Not Earned'} • {achievement.points} points
                      </Badge>
                    </div>
                  </div>
                </ListItem>
              ))}
            </List>
          </Card>
        </motion.div>

        {/* Tasks Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <Card className="rounded-2xl shadow-lg hover:shadow-xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <Title>Tasks</Title>
              </div>
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                New Task
              </button>
            </div>

            {tasksError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {tasksError}
              </div>
            )}

            {tasksLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No tasks found. Create a new task to get started!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">
                        Title
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{task.title}</div>
                            {task.description && (
                              <div className="text-sm text-gray-500">{task.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(task.dueDate).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as 'PENDING' | 'COMPLETED')}
                            className={`rounded-full px-3 py-1 text-sm font-medium ${
                              task.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <Card className="rounded-2xl shadow-lg hover:shadow-xl border border-gray-100">
            <Title>Recent Activity</Title>
            <List className="mt-6">
              {pointHistory.slice(0, 5).map((point, index) => (
                <ListItem key={index} className="hover:bg-gray-50 rounded-xl transition-colors duration-150">
                  <Flex justifyContent="start" className="space-x-4">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <Trophy className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <Text><Bold>{point.points} points</Bold> earned in {point.course}</Text>
                      <Text className="text-sm text-gray-500">
                        {new Date(point.date).toLocaleString()}
                      </Text>
                    </div>
                  </Flex>
                </ListItem>
              ))}
            </List>
          </Card>
        </motion.div>
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleCreateTask}
      />
    </div>
  );
}
