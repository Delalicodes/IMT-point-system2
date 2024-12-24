import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Button,
  List,
  ListItem,
  Title,
  Flex,
  Badge,
  Metric,
} from '@tremor/react';
import { Clock, Coffee, LogOut, History, Timer } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface ClockingRecord {
  id: string;
  userId: string;
  type: 'IN' | 'BREAK' | 'OUT';
  timestamp: string;
  totalHours?: number;
}

export default function ClockingDialog() {
  const [clockingHistory, setClockingHistory] = useState<ClockingRecord[]>([]);
  const [currentStatus, setCurrentStatus] = useState<'OUT' | 'IN' | 'BREAK'>('OUT');
  const [isLoading, setIsLoading] = useState(false);
  const [showClockingDialog, setShowClockingDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState<string>('');
  const [lastClockIn, setLastClockIn] = useState<Date | null>(null);

  useEffect(() => {
    fetchClockingHistory();
  }, []);

  useEffect(() => {
    if (currentStatus !== 'OUT') {
      const interval = setInterval(() => {
        if (lastClockIn) {
          setTimeElapsed(formatDistanceToNow(lastClockIn));
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentStatus, lastClockIn]);

  const fetchClockingHistory = async () => {
    try {
      console.log('Fetching history...');
      const response = await fetch('/api/clocking/history');
      if (!response.ok) {
        throw new Error('Failed to fetch clocking history');
      }
      const data = await response.json();
      console.log('History response:', data);

      if (data.history && data.history.length > 0) {
        setClockingHistory(data.history);
        
        // Get the most recent record
        const latestRecord = data.history[0];
        console.log('Latest record:', latestRecord);
        
        // Update status based on latest record
        setCurrentStatus(latestRecord.type);
        if (latestRecord.type === 'IN') {
          setLastClockIn(new Date(latestRecord.timestamp));
        } else if (latestRecord.type === 'OUT') {
          setLastClockIn(null);
        }
      } else {
        setClockingHistory([]);
        setCurrentStatus('OUT');
        setLastClockIn(null);
      }
    } catch (error) {
      console.error('Error fetching clocking history:', error);
      setClockingHistory([]);
    }
  };

  const handleClocking = async (type: 'IN' | 'BREAK' | 'OUT') => {
    setIsLoading(true);
    try {
      console.log('Clocking action started:', type);
      const response = await fetch('/api/clocking/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Clocking response:', data);
        
        // Update status immediately
        setCurrentStatus(type);
        if (type === 'IN') {
          setLastClockIn(new Date());
        } else if (type === 'OUT') {
          setLastClockIn(null);
        }
        
        // Close dialog and fetch latest history
        setShowClockingDialog(false);
        await fetchClockingHistory();
      }
    } catch (error) {
      console.error('Error recording clocking:', error);
    }
    setIsLoading(false);
  };

  const getStatusColor = (status: 'IN' | 'OUT' | 'BREAK') => {
    switch (status) {
      case 'IN': return 'bg-emerald-100 text-emerald-800';
      case 'BREAK': return 'bg-amber-100 text-amber-800';
      case 'OUT': return 'bg-rose-100 text-rose-800';
    }
  };

  const getNextAction = () => {
    switch (currentStatus) {
      case 'OUT': return { type: 'IN', label: 'Clock In', Icon: Clock };
      case 'IN': return { type: 'OUT', label: 'Clock Out', Icon: LogOut };
      case 'BREAK': return { type: 'IN', label: 'Resume', Icon: Timer };
    }
  };

  const nextAction = getNextAction();

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="secondary"
        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 rounded-xl px-3 py-1.5 text-sm shadow-lg"
        onClick={() => setShowClockingDialog(true)}
      >
        <nextAction.Icon className="w-3 h-3 mr-1.5" />
        {nextAction.label}
      </Button>

      <Button
        size="sm"
        variant="secondary"
        className="bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 rounded-xl px-3 py-1.5 text-sm shadow-lg"
        onClick={() => setShowHistoryDialog(true)}
      >
        <History className="w-3 h-3 mr-1.5" />
        History
      </Button>

      {showClockingDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-white shadow-2xl rounded-3xl overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div>
                <Title>Time Tracking</Title>
                <Text className="text-gray-500">Manage your work hours</Text>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowClockingDialog(false)}
                className="rounded-full p-2 h-8 w-8"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-6">
              {/* Current Status */}
              <Card className="bg-gray-50 rounded-2xl">
                <Flex>
                  <div>
                    <Text>Current Status</Text>
                    <Badge
                      className={`mt-1 ${getStatusColor(currentStatus)} rounded-full px-3`}
                    >
                      {currentStatus}
                    </Badge>
                  </div>
                  {timeElapsed && currentStatus !== 'OUT' && (
                    <div className="text-right">
                      <Text>Time Elapsed</Text>
                      <Metric className="text-lg">{timeElapsed}</Metric>
                    </div>
                  )}
                </Flex>
              </Card>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {currentStatus === 'OUT' && (
                  <Button
                    size="lg"
                    variant="primary"
                    onClick={() => handleClocking('IN')}
                    disabled={isLoading}
                    className="col-span-2 bg-emerald-500 hover:bg-emerald-600 rounded-2xl"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Start Working
                  </Button>
                )}

                {currentStatus === 'IN' && (
                  <>
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={() => handleClocking('BREAK')}
                      disabled={isLoading}
                      className="bg-amber-500 hover:bg-amber-600 text-white rounded-2xl"
                    >
                      <Coffee className="w-4 h-4 mr-2" />
                      Take Break
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={() => handleClocking('OUT')}
                      disabled={isLoading}
                      className="bg-rose-500 hover:bg-rose-600 text-white rounded-2xl"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Finish Day
                    </Button>
                  </>
                )}

                {currentStatus === 'BREAK' && (
                  <Button
                    size="lg"
                    variant="primary"
                    onClick={() => handleClocking('IN')}
                    disabled={isLoading}
                    className="col-span-2 bg-emerald-500 hover:bg-emerald-600 rounded-2xl"
                  >
                    <Timer className="w-4 h-4 mr-2" />
                    Resume Work
                  </Button>
                )}
              </div>

              {/* Quick Stats */}
              <Card className="bg-gray-50 rounded-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Text>Today's Hours</Text>
                    <Metric className="text-lg">
                      {clockingHistory
                        .filter(r => r.totalHours && new Date(r.timestamp).toDateString() === new Date().toDateString())
                        .reduce((acc, curr) => acc + (curr.totalHours || 0), 0)
                        .toFixed(1)}h
                    </Metric>
                  </div>
                  <div>
                    <Text>Week Total</Text>
                    <Metric className="text-lg">
                      {clockingHistory
                        .filter(r => r.totalHours && new Date(r.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
                        .reduce((acc, curr) => acc + (curr.totalHours || 0), 0)
                        .toFixed(1)}h
                    </Metric>
                  </div>
                </div>
              </Card>
            </div>
          </Card>
        </div>
      )}

      {showHistoryDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-2xl bg-white shadow-2xl rounded-3xl overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div>
                <Title>Time History</Title>
                <Text className="text-gray-500">Your work session records</Text>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowHistoryDialog(false)}
                className="rounded-full p-2 h-8 w-8"
              >
                ✕
              </Button>
            </div>

            <Card className="rounded-2xl">
              <List>
                {clockingHistory.map((record) => (
                  <ListItem key={record.id} className="rounded-xl">
                    <Flex>
                      <div className="flex-1">
                        <Text className="font-medium">
                          {format(new Date(record.timestamp), 'MMM dd, yyyy')}
                        </Text>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`${getStatusColor(record.type)} rounded-full px-3`}>
                            {record.type}
                          </Badge>
                          <Text className="text-sm text-gray-500">
                            {format(new Date(record.timestamp), 'HH:mm')}
                          </Text>
                        </div>
                      </div>
                      {record.totalHours && (
                        <div className="text-right">
                          <Text className="font-medium">Duration</Text>
                          <Text className="text-gray-500">
                            {record.totalHours.toFixed(1)}h
                          </Text>
                        </div>
                      )}
                    </Flex>
                  </ListItem>
                ))}
              </List>
            </Card>
          </Card>
        </div>
      )}
    </div>
  );
}
