'use client';

import { Card, DonutChart, BarChart } from '@tremor/react';
import { User, DollarSign, UserCog } from 'lucide-react';

const performanceData = [
  {
    name: "Jr. Knights",
    "Performance": 90,
  },
  {
    name: "Gladiators",
    "Performance": 60,
  },
  {
    name: "Spartans",
    "Performance": 75,
  },
];

const topPerformers = [
  { name: 'Nivaan', role: 'Jr. Knights', attendance: '90%', badge: 'Blue Badge' },
  { name: 'Navya', role: 'Gladiators', attendance: '80%', badge: 'Pink Badge' },
  { name: 'Anugrah', role: 'Spartans', attendance: '70%', badge: 'Orange Badge' },
];

const revenueData = {
  total: '50M',
  offline: '25M',
  online: '50%',
  events: '20%',
};

export default function DashboardPage() {
  return (
    <div className="p-8 bg-gray-50 flex-1">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Welcome to IMT Points</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className="px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserCog className="text-blue-600 w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-bold">534</div>
              <div className="text-gray-500">Coaches</div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <User className="text-blue-600 w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-bold">9.7k</div>
              <div className="text-gray-500">Kids</div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="text-blue-600 w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-bold">50 M</div>
              <div className="text-gray-500">Revenue</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Today's Status */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Today's Status</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold">8.7K</div>
              <div className="text-gray-500">Total Present</div>
            </div>
            <div>
              <div className="text-2xl font-bold">99</div>
              <div className="text-gray-500">Registrations</div>
            </div>
            <div>
              <div className="text-2xl font-bold">30</div>
              <div className="text-gray-500">Total Sessions</div>
            </div>
          </div>
        </Card>

        {/* Batch Performance */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Batch Performance</h2>
          <BarChart
            data={performanceData}
            index="name"
            categories={["Performance"]}
            colors={["blue"]}
            className="h-48"
          />
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Revenue Generated */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Revenue Generated</h2>
          <div className="flex items-center justify-between">
            <DonutChart
              data={[
                { name: 'Online', value: 50 },
                { name: 'Offline', value: 30 },
                { name: 'Events', value: 20 },
              ]}
              category="value"
              index="name"
              colors={["blue", "cyan", "indigo"]}
              className="h-40"
            />
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Online (50%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                <span>Offline (30%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span>Events (20%)</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Top Performers */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Top Performer</h2>
          <div className="space-y-4">
            {topPerformers.map((performer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div>
                    <div className="font-semibold">{performer.name}</div>
                    <div className="text-sm text-gray-500">{performer.role}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{performer.attendance}</div>
                  <div className="text-sm text-gray-500">{performer.badge}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
