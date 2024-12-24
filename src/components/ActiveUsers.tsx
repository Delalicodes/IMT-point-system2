import React, { useEffect, useState } from 'react';
import {
  Card,
  Title,
  Text,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
} from '@tremor/react';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActiveUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'IN' | 'BREAK' | 'OUT';
  lastUpdate: string;
}

export default function ActiveUsers() {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const response = await fetch('/api/clocking/active');
        if (response.ok) {
          const data = await response.json();
          setActiveUsers(data.users);
        }
      } catch (error) {
        console.error('Error fetching active users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveUsers();
    // Refresh more frequently (every 5 seconds) for better real-time updates
    const interval = setInterval(fetchActiveUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'IN':
        return {
          icon: Clock,
          color: 'bg-emerald-100 text-emerald-800',
          text: 'Actively Working'
        };
      case 'BREAK':
        return {
          icon: Coffee,
          color: 'bg-amber-100 text-amber-800',
          text: 'On Break'
        };
      default:
        return {
          icon: Clock,
          color: 'bg-gray-100 text-gray-800',
          text: 'Unknown'
        };
    }
  };

  if (loading) {
    return (
      <Card className="mt-6 rounded-xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (activeUsers.length === 0) {
    return (
      <Card className="mt-6 rounded-xl bg-white/50 backdrop-blur-sm">
        <div className="text-center py-6">
          <Text className="text-gray-500">No active users at the moment</Text>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mt-6 rounded-xl bg-white/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Title>Active Users</Title>
          <Text className="mt-1">Currently active students and their status</Text>
        </div>
        <Badge className="bg-emerald-100 text-emerald-800 rounded-lg px-3 py-1">
          {activeUsers.length} Active
        </Badge>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100">
        <Table>
          <TableHead>
            <TableRow className="bg-gray-50/50">
              <TableHeaderCell className="w-1/3">Name</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Duration</TableHeaderCell>
              <TableHeaderCell className="text-right">Last Update</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <AnimatePresence mode="sync">
              {activeUsers.map((user) => {
                const statusInfo = getStatusInfo(user.status);
                const StatusIcon = statusInfo.icon;
                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <TableCell>
                      <Text className="font-medium">{user.name}</Text>
                      <Text className="text-gray-500 text-sm">{user.role}</Text>
                    </TableCell>
                    <TableCell>
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <Badge className={`${statusInfo.color} rounded-lg px-3 py-1`}>
                          <div className="flex items-center gap-1.5">
                            <StatusIcon className="w-4 h-4" />
                            {statusInfo.text}
                          </div>
                        </Badge>
                      </motion.div>
                    </TableCell>
                    <TableCell>
                      <Text className="text-gray-600">
                        {formatDistanceToNow(new Date(user.lastUpdate))}
                      </Text>
                    </TableCell>
                    <TableCell className="text-right">
                      <Text className="text-gray-500">
                        {new Date(user.lastUpdate).toLocaleTimeString()}
                      </Text>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
