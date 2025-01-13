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
  Select,
  SelectItem,
} from '@tremor/react';
import { Clock, Coffee, LogOut, History, Timer, Calendar, BookOpen, X } from 'lucide-react';
import {
  format,
  formatDistanceToNow,
  isWithinInterval,
  startOfDay,
  endOfDay,
  subDays,
} from 'date-fns';
import { DayPicker, SelectRangeEventHandler } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import CustomAlert from './CustomAlert';
import { useSession } from 'next-auth/react';

interface ClockingRecord {
  id: string;
  userId: string;
  type: 'IN' | 'BREAK' | 'OUT';
  timestamp: string;
  totalHours?: number;
  subject?: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  courseId: string;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export default function ClockingDialog() {
  const [clockingHistory, setClockingHistory] = useState<ClockingRecord[]>([]);
  const [currentStatus, setCurrentStatus] = useState<'OUT' | 'IN' | 'BREAK'>('OUT');
  const [isLoading, setIsLoading] = useState(false);
  const [showClockingDialog, setShowClockingDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState<string>('');
  const [lastClockIn, setLastClockIn] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [userCourse, setUserCourse] = useState<{ id: string; name: string } | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showSubjectModal, setShowSubjectModal] = useState(false);

  const { data: session } = useSession();

  useEffect(() => {
    console.log('Current session:', session);
  }, [session]);

  useEffect(() => {
    fetchClockingHistory();
  }, []);

  useEffect(() => {
    if (showSubjectModal) {
      fetchUserSubjects();
    }
  }, [showSubjectModal]);

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

  const assignCourse = async (courseId: string) => {
    try {
      const response = await fetch('/api/user/assign-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign course');
      }

      const data = await response.json();
      console.log('Course assigned:', data);
      return data.course;
    } catch (error) {
      console.error('Error assigning course:', error);
      throw error;
    }
  };

  const fetchUserSubjects = async () => {
    try {
      setIsLoading(true);
      setShowAlert(false);
      
      // Step 1: Get all courses first
      console.log('Fetching courses...');
      const coursesResponse = await fetch('/api/courses');
      const courses = await coursesResponse.json();
      
      if (!coursesResponse.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      console.log('Available courses:', courses);
      
      if (!courses || courses.length === 0) {
        throw new Error('No courses available in the system');
      }
      
      // Step 2: Try to get user's current course
      console.log('Fetching user course...');
      const userCourseResponse = await fetch('/api/user/course');
      
      if (userCourseResponse.status === 404) {
        // User has no course, assign the first available course
        const firstCourse = courses[0];
        console.log('Assigning first course:', firstCourse);
        
        const assignResponse = await fetch('/api/user/assign-course', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId: firstCourse.id })
        });
        
        if (!assignResponse.ok) {
          throw new Error('Failed to assign course');
        }
        
        const { course } = await assignResponse.json();
        console.log('Course assigned:', course);
        
        if (!course.subjects || course.subjects.length === 0) {
          throw new Error('No subjects available in the assigned course');
        }
        
        setSubjects(course.subjects);
      } else if (userCourseResponse.ok) {
        const { course } = await userCourseResponse.json();
        console.log('User course:', course);
        
        if (!course.subjects || course.subjects.length === 0) {
          throw new Error('No subjects available in your course');
        }
        
        setSubjects(course.subjects);
      } else {
        const error = await userCourseResponse.json();
        throw new Error(error.error || 'Failed to fetch user course');
      }
    } catch (error) {
      console.error('Error:', error);
      setAlertMessage(error instanceof Error ? error.message : 'Failed to load subjects');
      setShowAlert(true);
      setSubjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClocking = async (type: 'IN' | 'BREAK' | 'OUT') => {
    if (!selectedSubject && type === 'IN') {
      setAlertMessage('Please select a subject before clocking in');
      setShowAlert(true);
      return;
    }

    setIsLoading(true);
    try {
      console.log('Clocking action started:', type);
      const response = await fetch('/api/clocking/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          subject: type === 'IN' ? selectedSubject : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record clocking');
      }

      const data = await response.json();
      console.log('Clocking response:', data);

      // Update status and history
      setCurrentStatus(type);
      if (type === 'IN') {
        setLastClockIn(new Date());
      } else if (type === 'OUT') {
        setLastClockIn(null);
        setSelectedSubject('');
      }

      await fetchClockingHistory();
      setShowClockingDialog(false);
    } catch (error) {
      console.error('Error recording clocking:', error);
      setAlertMessage('Failed to record clocking. Please try again.');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubjectSubmit = async () => {
    if (!selectedSubject) {
      setAlertMessage('Please select a subject before clocking in');
      setShowAlert(true);
      return;
    }
    await handleClocking('IN');
    setShowSubjectModal(false);
  };

  const handleClockInClick = () => {
    setShowSubjectModal(true);
  };

  const getStatusColor = (status: 'IN' | 'OUT' | 'BREAK') => {
    switch (status) {
      case 'IN':
        return 'bg-emerald-100 text-emerald-800';
      case 'BREAK':
        return 'bg-amber-100 text-amber-800';
      case 'OUT':
        return 'bg-rose-100 text-rose-800';
    }
  };

  const getNextAction = () => {
    switch (currentStatus) {
      case 'OUT':
        return { type: 'IN', label: 'Clock In', Icon: Clock };
      case 'IN':
        return { type: 'OUT', label: 'Clock Out', Icon: LogOut };
      case 'BREAK':
        return { type: 'IN', label: 'Resume', Icon: Timer };
    }
  };

  const handleDateRangeSelect: SelectRangeEventHandler = (range) => {
    if (range?.from) {
      setDateRange({ from: range.from, to: range.to });
    }
    setShowDatePicker(false);
  };

  const filteredHistory = clockingHistory.filter((record) => {
    if (!dateRange.from) return true;

    const recordDate = new Date(record.timestamp);
    const from = startOfDay(dateRange.from);
    const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);

    return isWithinInterval(recordDate, { start: from, end: to });
  });

  const clearDateRange = () => {
    setDateRange({ from: undefined, to: undefined });
  };

  const setLastWeek = () => {
    const today = new Date();
    setDateRange({
      from: subDays(today, 7),
      to: today,
    });
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-lg"
          >
            <Card className="bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                  <Title className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Clocking Management
                  </Title>
                  <button
                    onClick={() => setShowClockingDialog(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <Text className="text-gray-600">Current Status:</Text>
                    <Badge 
                      color={currentStatus === 'OUT' ? 'red' : currentStatus === 'BREAK' ? 'yellow' : 'green'}
                      className="px-3 py-1.5 text-sm font-medium rounded-full"
                    >
                      {currentStatus}
                    </Badge>
                  </div>
                  {lastClockIn && (
                    <div className="flex items-center justify-between">
                      <Text className="text-gray-600">Time Elapsed:</Text>
                      <Text className="font-semibold text-indigo-600">{timeElapsed}</Text>
                    </div>
                  )}
                </div>

                <Flex className="gap-3 pt-4 border-t border-gray-100">
                  {currentStatus === 'OUT' && (
                    <Button
                      onClick={handleClockInClick}
                      disabled={isLoading}
                      icon={Clock}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md rounded-xl"
                    >
                      Clock In
                    </Button>
                  )}
                  {currentStatus === 'IN' && (
                    <>
                      <Button
                        onClick={() => handleClocking('BREAK')}
                        disabled={isLoading}
                        icon={Coffee}
                        className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md rounded-xl"
                      >
                        Take Break
                      </Button>
                      <Button
                        onClick={() => handleClocking('OUT')}
                        disabled={isLoading}
                        icon={LogOut}
                        className="flex-1 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-md rounded-xl"
                      >
                        Clock Out
                      </Button>
                    </>
                  )}
                  {currentStatus === 'BREAK' && (
                    <Button
                      onClick={() => handleClocking('IN')}
                      disabled={isLoading}
                      icon={Timer}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md rounded-xl"
                    >
                      Resume Work
                    </Button>
                  )}
                </Flex>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {showSubjectModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md"
          >
            <Card className="bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                  <Title className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Select Subject
                  </Title>
                  <button
                    onClick={() => setShowSubjectModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  <Text className="text-gray-600 font-medium">Which subject will you be working on?</Text>
                  <div className="relative">
                    <Select
                      value={selectedSubject}
                      onValueChange={setSelectedSubject}
                      placeholder="Choose a subject..."
                      className="w-full bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {subjects.length === 0 ? (
                        <SelectItem value="loading" disabled>
                          No subjects available
                        </SelectItem>
                      ) : (
                        subjects.map((subject) => (
                          <SelectItem 
                            key={subject.id} 
                            value={subject.id}
                            className="py-2.5 px-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{subject.name}</span>
                              <span className="text-sm text-gray-500">{subject.code}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </Select>
                  </div>
                  {subjects.length === 0 && (
                    <div className="text-sm text-gray-500 flex items-center space-x-2 mt-2">
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></span>
                      <span>Loading subjects...</span>
                    </div>
                  )}
                </div>

                <Flex className="gap-3 pt-4 border-t border-gray-100">
                  <Button
                    onClick={() => setShowSubjectModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-sm rounded-xl transition-colors duration-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubjectSubmit}
                    disabled={isLoading || !selectedSubject}
                    icon={Clock}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Confirm
                  </Button>
                </Flex>
              </div>
            </Card>
          </motion.div>
        </motion.div>
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

            {/* Date Filter Section */}
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl"
                  >
                    <Calendar className="w-4 h-4" />
                    {dateRange.from ? (
                      <span>
                        {format(dateRange.from, 'MMM d, yyyy')}
                        {dateRange.to && ` - ${format(dateRange.to, 'MMM d, yyyy')}`}
                      </span>
                    ) : (
                      'Select dates'
                    )}
                  </Button>
                  {dateRange.from && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={clearDateRange}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={setLastWeek}
                  className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl"
                >
                  Last 7 days
                </Button>
              </div>

              {/* Date Picker Popover */}
              {showDatePicker && (
                <div className="absolute z-50 mt-2 p-3 bg-white rounded-xl shadow-lg border border-gray-200">
                  <DayPicker
                    mode="range"
                    selected={dateRange}
                    onSelect={handleDateRangeSelect}
                    numberOfMonths={1}
                    className="bg-white !font-sans"
                    showOutsideDays
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center px-2",
                      caption_label: "text-sm font-medium text-gray-900",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-gray-500 rounded-md w-8 font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "text-center text-sm relative p-0 rounded-md focus-within:relative focus-within:z-20",
                      day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-md",
                      day_selected: "bg-blue-500 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-500 focus:text-white",
                      day_today: "bg-gray-100",
                      day_outside: "text-gray-400 opacity-50",
                      day_disabled: "text-gray-400 opacity-50",
                      day_range_middle: "aria-selected:bg-blue-100 aria-selected:text-blue-900",
                      day_hidden: "invisible",
                    }}
                    components={{
                      IconLeft: () => <span className="text-gray-600">←</span>,
                      IconRight: () => <span className="text-gray-600">→</span>,
                    }}
                  />
                </div>
              )}
            </div>

            {/* History List */}
            <Card className="rounded-2xl">
              <div className="overflow-y-auto max-h-[400px]">
                <List>
                  {filteredHistory.map((record) => (
                    <ListItem key={record.id} className="rounded-xl hover:bg-gray-50">
                      <Flex>
                        <div className="flex-1">
                          <Text className="font-medium">
                            {format(new Date(record.timestamp), 'MMM dd, yyyy')}
                          </Text>
                          <Text className="text-gray-500">
                            {format(new Date(record.timestamp), 'h:mm a')}
                          </Text>
                        </div>
                        <div className="flex items-center gap-4">
                          {record.totalHours && (
                            <Text className="text-gray-600">
                              {record.totalHours.toFixed(1)}h
                            </Text>
                          )}
                          <Badge className={getStatusColor(record.type)}>
                            {record.type}
                          </Badge>
                        </div>
                      </Flex>
                    </ListItem>
                  ))}
                </List>
              </div>
            </Card>
          </Card>
        </div>
      )}

      <CustomAlert
        message={alertMessage}
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
      />
    </div>
  );
}
