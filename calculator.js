import React, { useState } from 'react';

const InnovationCalculator = () => {
  const roles = {
    'BIM Regisseur': { rate: 85, count: 1 },
    'BIM Coordinatoren': { rate: 60, count: 2 },
    'Quality Engineers': { rate: 55, count: 2 },
    'BIM Modelleur - Junior': { rate: 40, count: 8 },
    'BIM Modelleur - Senior': { rate: 55, count: 8 },
    'Projectmanagers': { rate: 55, count: 2 },
    'Softwaredeveloper': { rate: 55, count: 1 }
  };

  const [innovationName, setInnovationName] = useState('');
  const [activities, setActivities] = useState([{
    id: Date.now(),
    name: '',
    role: Object.keys(roles)[0],
    currentTime: 30,
    newTime: 15,
    frequency: 1,
    workingDaysPerMonth: 20,
    peopleCount: roles[Object.keys(roles)[0]].count
  }]);

  const formatTime = (seconds) => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const formatMoney = (amount) => {
    return Math.round(amount).toLocaleString();
  };

  const getDailySaved = (activity) => {
    return (activity.currentTime - activity.newTime) * activity.frequency;
  };

  const calculateImpact = () => {
    let totalYearlySavings = 0;
    activities.forEach(activity => {
      const savedTimePerDay = getDailySaved(activity);
      const workingDaysPerYear = activity.workingDaysPerMonth * 12;
      const savedHoursPerYear = (savedTimePerDay * workingDaysPerYear) / 3600;
      const savings = savedHoursPerYear * roles[activity.role].rate * activity.peopleCount;
      totalYearlySavings += savings;
    });
    return totalYearlySavings;
  };

  const getYearlyImpact = () => calculateImpact();
  const getMonthlyImpact = () => calculateImpact() / 12;
  const getWeeklyImpact = () => getMonthlyImpact() / 4.33;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6">B4P Innovation Impact Calculator</h1>
        
        <div className="mb-6">
          <label className="block mb-2">Innovation Name</label>
          <input
            type="text"
            value={innovationName}
            onChange={(e) => setInnovationName(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter innovation name"
          />
        </div>

        {activities.map((activity, index) => (
          <div key={activity.id} className="mb-6 border rounded-lg p-6 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg">Activity {index + 1}</h3>
              <button
                onClick={() => setActivities(activities.filter(a => a.id !== activity.id))}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block mb-2">Activity Name</label>
                <input
                  type="text"
                  placeholder="Enter activity name"
                  className="w-full p-2 border rounded"
                  value={activity.name}
                  onChange={(e) => {
                    const newActivities = [...activities];
                    newActivities[index] = { ...activity, name: e.target.value };
                    setActivities(newActivities);
                  }}
                />
              </div>

              <div>
                <label className="block mb-2">Role</label>
                <select
                  className="w-full p-2 border rounded"
                  value={activity.role}
                  onChange={(e) => {
                    const newActivities = [...activities];
                    newActivities[index] = {
                      ...activity,
                      role: e.target.value,
                      peopleCount: roles[e.target.value].count
                    };
                    setActivities(newActivities);
                  }}
                >
                  {Object.entries(roles).map(([role, data]) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block mb-2">
                  Current Time ({formatTime(activity.currentTime)})
                </label>
                <input
                  type="range"
                  min="10"
                  max="600"
                  value={activity.currentTime}
                  className="w-full"
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value);
                    const newActivities = [...activities];
                    newActivities[index] = {
                      ...activity,
                      currentTime: newValue,
                      newTime: Math.min(activity.newTime, newValue)
                    };
                    setActivities(newActivities);
                  }}
                />
              </div>

              <div>
                <label className="block mb-2">
                  Time After Innovation ({formatTime(activity.newTime)})
                </label>
                <input
                  type="range"
                  min="0"
                  max={activity.currentTime}
                  value={activity.newTime}
                  className="w-full"
                  onChange={(e) => {
                    const newActivities = [...activities];
                    newActivities[index] = { ...activity, newTime: parseInt(e.target.value) };
                    setActivities(newActivities);
                  }}
                />
              </div>

              <div>
                <label className="block mb-2">
                  Average Days per Month this Activity is Executed ({activity.workingDaysPerMonth} days)
                </label>
                <input
                  type="range"
                  min="1"
                  max="23"
                  value={activity.workingDaysPerMonth}
                  className="w-full"
                  onChange={(e) => {
                    const newActivities = [...activities];
                    newActivities[index] = { ...activity, workingDaysPerMonth: parseInt(e.target.value) };
                    setActivities(newActivities);
                  }}
                />
              </div>

              <div>
                <label className="block mb-2">Frequency per Day</label>
                <input
                  type="number"
                  min="1"
                  value={activity.frequency}
                  className="w-full p-2 border rounded"
                  onChange={(e) => {
                    const newActivities = [...activities];
                    newActivities[index] = { ...activity, frequency: parseInt(e.target.value) || 1 };
                    setActivities(newActivities);
                  }}
                />
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Daily time saved: {Math.round(getDailySaved(activity) / 60)} minutes
            </div>
          </div>
        ))}

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActivities([...activities, {
              id: Date.now(),
              name: '',
              role: Object.keys(roles)[0],
              currentTime: 30,
              newTime: 15,
              frequency: 1,
              workingDaysPerMonth: 20,
              peopleCount: roles[Object.keys(roles)[0]].count
            }])}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Activity
          </button>
          <button
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Download PDF Report
          </button>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="font-medium mb-4">Business Case Impact</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Weekly Impact</p>
              <p className="text-lg">€{formatMoney(getWeeklyImpact())}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Monthly Impact</p>
              <p className="text-lg">€{formatMoney(getMonthlyImpact())}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Yearly Impact</p>
              <p className="text-lg">€{formatMoney(getYearlyImpact())}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InnovationCalculator;
