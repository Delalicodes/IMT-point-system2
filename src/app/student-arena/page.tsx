'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  Title,
  Text,
  BarChart,
  Flex,
  Grid,
  Col,
  Badge,
  Metric,
  ProgressBar,
  DonutChart,
  Color,
  List,
  ListItem,
  Bold,
  Subtitle,
} from '@tremor/react';
import { useSession } from 'next-auth/react';
import {
  Trophy,
  Target,
  TrendingUp,
  Clock,
  Calendar,
  Medal,
  Award,
  Star,
  ChevronRight,
  Zap,
  BookOpen,
  CheckCircle2,
  ArrowUp,
  Flame,
  Banknote,
  Calculator,
  ChartPieIcon,
  CalendarDays,
  Crown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import ClockingDialog from '@/components/ClockingDialog';

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

const cardColors: Color[] = ['indigo', 'rose', 'amber', 'emerald', 'blue', 'violet']

// Define modern color schemes for charts with lighter, more pastel colors
const chartColors = [
  '#7DD3FC', // lighter blue
  '#FDA4AF', // lighter pink
  '#FCD34D', // soft yellow
  '#86EFAC', // mint green
  '#C4B5FD', // lavender
  '#FED7AA'  // peach
];

const barChartColors = ['#7DD3FC']; // lighter blue

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

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'Quick Learner',
      description: 'Earn 50 points in a single day',
      points: 50,
      icon: Zap,
      color: 'bg-yellow-500',
      earned: true,
    },
    {
      id: '2',
      title: 'Knowledge Seeker',
      description: 'Complete 5 different courses',
      points: 100,
      icon: BookOpen,
      color: 'bg-blue-500',
      earned: true,
    },
    {
      id: '3',
      title: 'Master Student',
      description: 'Reach level 10',
      points: 200,
      icon: Award,
      color: 'bg-purple-500',
      earned: false,
    },
  ];

  const modernValueFormatter = (value: number) => {
    const percentage = ((value / totalPoints) * 100).toFixed(0);
    return `${percentage}%`;
  };

  useEffect(() => {
    if (session?.user) {
      fetchPointData();
    }
  }, [session]);

  const fetchPointData = async () => {
    try {
      console.log('Fetching point data...');
      const response = await fetch('/api/student/points');
      const data = await response.json();
      
      console.log('Received data:', data);
      
      // Ensure we're using the correct field names and providing defaults
      setTotalPoints(data.total || 0);
      setDailyPoints(data.daily || 0);
      setWeeklyPoints(data.weekly || 0);
      setLeaderboardPosition(data.leaderboardPosition || 0);
      setTotalStudents(data.totalStudents || 0);
      
      // Ensure history data is properly formatted
      const formattedHistory = (data.history || []).map((point: any) => ({
        date: point.date,
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

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const courseData = (pointHistory || []).reduce((acc: { [key: string]: number }, curr) => {
    if (curr && curr.course) {
      acc[curr.course] = (acc[curr.course] || 0) + (curr.points || 0);
    }
    return acc;
  }, {} as { [key: string]: number });

  const courseChartData = Object.entries(courseData).map(([name, value]) => ({
    name,
    points: value,
  }));

  // Calculate level and progress
  const pointsPerLevel = 1000;
  const calculateLevel = (points: number) => {
    const level = Math.floor(points / pointsPerLevel) + 1;
    const progress = (points % pointsPerLevel) / pointsPerLevel * 100;
    const pointsToNextLevel = pointsPerLevel - (points % pointsPerLevel);
    return { level, progress, pointsToNextLevel };
  };

  // Get motivational message based on progress
  const getMotivationalMessage = (progress: number) => {
    if (progress >= 90) return "Almost there! You're so close! 🚀";
    if (progress >= 75) return "Keep pushing! The next level awaits! 💪";
    if (progress >= 50) return "Halfway there! You're doing great! 🌟";
    if (progress >= 25) return "Great progress! Keep going! 🎯";
    return "Every point counts! You've got this! 💫";
  };

  // Calculate GHC value from points (5 GHC per 20 points)
  const calculateGHC = (points: number) => {
    return (points / 20) * 5;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-10 mx-auto max-w-7xl"
    >
      {/* Welcome Section with Particle Effect */}
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white shadow-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative z-10"
        >
          <h1 className="text-4xl font-bold mb-2">
            Welcome to Your Learning Journey! 🚀
          </h1>
          <p className="text-purple-100">
            Track your progress, earn achievements, and level up your knowledge!
          </p>
        </motion.div>
        <div className="absolute top-0 left-0 w-full h-full bg-white/10 backdrop-blur-sm"></div>
      </div>

      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Student Performance Analytics
            </h1>
            <p className="mt-1 text-gray-500">
              Track your progress and achievements in real-time
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            <ClockingDialog />
            <div className="flex items-center px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl shadow-lg">
              <Crown className="w-5 h-5 text-white mr-2" />
              <Text className="text-white font-semibold">
                Rank #{leaderboardPosition}
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <Grid numItemsLg={4} className="gap-6 mb-8">
        {[
          { 
            title: 'Total Points', 
            value: totalPoints || 0, 
            icon: Trophy, 
            color: 'indigo',
            trend: 'Overall Progress',
            suffix: ' pts'
          },
          { 
            title: 'Daily Points', 
            value: dailyPoints || 0, 
            icon: Flame, 
            color: 'rose',
            trend: "Today's Earnings",
            suffix: ' pts'
          },
          { 
            title: 'Weekly Points', 
            value: weeklyPoints || 0, 
            icon: Target, 
            color: 'amber',
            trend: 'Last 7 Days',
            suffix: ' pts'
          },
          { 
            title: 'Leaderboard Rank', 
            value: leaderboardPosition || 0,
            icon: Medal,
            color: 'emerald',
            trend: `Out of ${totalStudents} Students`,
            suffix: getOrdinalSuffix(leaderboardPosition)
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card
              className="transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl rounded-2xl"
              decoration="top"
              decorationColor={stat.color}
            >
              <Flex alignItems="center" className="space-x-4">
                <div className={`p-3 rounded-2xl bg-${stat.color}-100/50`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <div className="space-y-1">
                  <Text className="text-sm text-gray-500">{stat.title}</Text>
                  <div className="flex items-baseline space-x-2">
                    <Metric className="text-2xl">
                      {typeof stat.value === 'number' 
                        ? stat.value.toLocaleString()
                        : stat.value}
                      {stat.suffix || ''}
                    </Metric>
                  </div>
                  <Text className="text-xs flex items-center text-gray-500">
                    <ArrowUp className="w-3 h-3 text-green-500 mr-1" />
                    {stat.trend}
                  </Text>
                </div>
              </Flex>
            </Card>
          </motion.div>
        ))}
      </Grid>

      {/* Progress Section with Enhanced Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Title>Points History</Title>
                <Text>Your point earning journey</Text>
              </div>
              <div className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl shadow-lg">
                <CalendarDays className="w-5 h-5 text-white mr-2" />
                <Text className="text-white font-semibold">
                  Last 30 Days
                </Text>
              </div>
            </div>
            <BarChart
              className="mt-4 h-72"
              data={pointHistory}
              index="date"
              categories={["points"]}
              colors={barChartColors}
              valueFormatter={modernValueFormatter}
              showLegend={false}
              showGridLines={false}
              showAnimation={true}
              startEndOnly={true}
              yAxisWidth={60}
            />
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <Title className="text-gray-600">Points Distribution</Title>
                  <Text className="text-gray-400">Points earned across courses</Text>
                </div>
                <Badge className="bg-blue-100 text-blue-700 rounded-lg">
                  Total: {totalPoints.toLocaleString()} pts
                </Badge>
              </div>
            </div>
            <DonutChart
              className="mt-4 h-52"
              data={courseChartData}
              category="points"
              index="name"
              valueFormatter={modernValueFormatter}
              colors={chartColors}
              showAnimation={true}
              showTooltip={true}
              variant="donut"
              label={`${((courseChartData[0]?.points || 0) / totalPoints * 100).toFixed(0)}%`}
              labelProps={{
                className: "text-3xl font-bold text-gray-500",
              }}
              valueClassName="text-gray-500"
              animationDuration={1000}
              thickness={36}
            />
            <div className="mt-6 space-y-2">
              {courseChartData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between px-2 py-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: chartColors[index % chartColors.length] }}
                    />
                    <span className="text-gray-500 text-sm">{item.name}</span>
                  </div>
                  <span className="text-gray-400 text-sm">
                    {((item.points / totalPoints) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Level Progress with Enhanced UI */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-8"
      >
        <Card className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Title>Level Progress</Title>
              <Text>Keep earning points to level up!</Text>
            </div>
            <div className="flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl shadow-lg">
              <Star className="w-5 h-5 text-white mr-2" />
              <Text className="text-white font-semibold">
                Level {calculateLevel(totalPoints).level}
              </Text>
            </div>
          </div>

          <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4 mb-6">
            <Card decoration="top" decorationColor="amber">
              <Flex alignItems="center">
                <div className="p-2 bg-amber-100 rounded-full">
                  <Trophy className="w-6 h-6 text-amber-600" />
                </div>
                <div className="ml-2">
                  <Text>Total Points</Text>
                  <Metric>{totalPoints.toLocaleString()}</Metric>
                </div>
              </Flex>
            </Card>
            
            <Card decoration="top" decorationColor="emerald">
              <Flex alignItems="center">
                <div className="p-2 bg-emerald-100 rounded-full">
                  <Target className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="ml-2">
                  <Text>Points to Next Level</Text>
                  <Metric>{calculateLevel(totalPoints).pointsToNextLevel.toLocaleString()}</Metric>
                </div>
              </Flex>
            </Card>

            <Card decoration="top" decorationColor="violet">
              <Flex alignItems="center">
                <div className="p-2 bg-violet-100 rounded-full">
                  <Award className="w-6 h-6 text-violet-600" />
                </div>
                <div className="ml-2">
                  <Text>Current Level</Text>
                  <Metric>{calculateLevel(totalPoints).level}</Metric>
                </div>
              </Flex>
            </Card>

            <Card decoration="top" decorationColor="blue">
              <Flex alignItems="center">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Star className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-2">
                  <Text>Progress</Text>
                  <Metric>{calculateLevel(totalPoints).progress.toFixed(1)}%</Metric>
                </div>
              </Flex>
            </Card>
          </Grid>

          <div className="space-y-3">
            <Flex>
              <Text>Progress to Level {calculateLevel(totalPoints).level + 1}</Text>
              <Text>{calculateLevel(totalPoints).progress.toFixed(1)}%</Text>
            </Flex>
            <ProgressBar
              value={calculateLevel(totalPoints).progress}
              color="amber"
              className="mt-3"
              showAnimation={true}
            />
            <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <Flex>
                <div className="flex items-center space-x-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  <Text>{getMotivationalMessage(calculateLevel(totalPoints).progress)}</Text>
                </div>
              </Flex>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Achievements with Enhanced Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Title>Points Value</Title>
              <Text>Convert your points to GHC</Text>
            </div>
            <div className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <Banknote className="w-5 h-5 text-white mr-2" />
              <Text className="text-white font-semibold">
                {calculateGHC(totalPoints).toFixed(2)} GHC
              </Text>
            </div>
          </div>

          <Grid numItems={1} numItemsSm={2} numItemsLg={2} className="gap-4 mb-6">
            <Card decoration="top" decorationColor="green">
              <Flex alignItems="center">
                <div className="p-2 bg-green-100 rounded-full">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-2">
                  <Text>Total Points</Text>
                  <Metric>{totalPoints.toLocaleString()} pts</Metric>
                </div>
              </Flex>
            </Card>

            <Card decoration="top" decorationColor="emerald">
              <Flex alignItems="center">
                <div className="p-2 bg-emerald-100 rounded-full">
                  <Banknote className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="ml-2">
                  <Text>Cash Value</Text>
                  <Metric>{calculateGHC(totalPoints).toFixed(2)} GHC</Metric>
                </div>
              </Flex>
            </Card>
          </Grid>

          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
              <Flex>
                <div className="flex items-center space-x-2">
                  <Calculator className="w-5 h-5 text-green-500" />
                  <Text>Conversion Rate: 20 points = 5 GHC</Text>
                </div>
              </Flex>
            </div>

            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <Title className="mb-2">Recent Earnings</Title>
              <List>
                <ListItem>
                  <Flex justifyContent="start" className="space-x-2">
                    <div className="p-1.5 bg-green-100 rounded-full">
                      <ArrowUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <Text className="text-gray-600">Daily Points</Text>
                      <Text className="text-gray-500">{dailyPoints} points = {calculateGHC(dailyPoints).toFixed(2)} GHC</Text>
                    </div>
                  </Flex>
                </ListItem>
                <ListItem>
                  <Flex justifyContent="start" className="space-x-2">
                    <div className="p-1.5 bg-blue-100 rounded-full">
                      <ArrowUp className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <Text className="text-gray-600">Weekly Points</Text>
                      <Text className="text-gray-500">{weeklyPoints} points = {calculateGHC(weeklyPoints).toFixed(2)} GHC</Text>
                    </div>
                  </Flex>
                </ListItem>
              </List>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function getOrdinalSuffix(n: number): string {
  if (n <= 0) return '';
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}
